package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type contextKey string

const (
	userKey  contextKey = "user"
	adminKey contextKey = "admin"
)

// userFromContext returns the authenticated username from the request context.
func userFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(userKey).(string); ok {
		return v
	}
	return ""
}

// isAdminFromContext returns true if the authenticated user has the admin claim.
func isAdminFromContext(ctx context.Context) bool {
	v, _ := ctx.Value(adminKey).(bool)
	return v
}

var (
	jwtSecret  []byte
	users      map[string]string // username → bcrypt hash
	adminUsers map[string]bool   // usernames with admin privileges
)

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	var (
		hash    string
		isAdmin bool
	)
	err := pool.QueryRow(r.Context(),
		`SELECT password, is_admin FROM users WHERE username = $1`, creds.Username).
		Scan(&hash, &isAdmin)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(creds.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	claims := jwt.MapClaims{
		"sub": creds.Username,
		"exp": time.Now().Add(15 * 24 * time.Hour).Unix(),
	}
	if isAdmin {
		claims["admin"] = true
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(jwtSecret)
	if err != nil {
		slog.Error("sign JWT", "err", err)
		writeError(w, http.StatusInternalServerError, "token error")
		return
	}

	slog.Info("login", "user", creds.Username)
	writeJSON(w, http.StatusOK, map[string]string{"token": signed})
}

// requireAuth extracts and validates a JWT from the Authorization header
// or from a "token" query parameter (used by EventSource/SSE).
func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := ""
		if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
			tokenStr = auth[7:]
		} else if t := r.URL.Query().Get("token"); t != "" {
			tokenStr = t
		}

		if tokenStr == "" {
			writeError(w, http.StatusUnauthorized, "missing token")
			return
		}

		tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			return jwtSecret, nil
		}, jwt.WithValidMethods([]string{"HS256"}))
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		if claims, ok := tok.Claims.(jwt.MapClaims); ok {
			if sub, _ := claims["sub"].(string); sub != "" {
				r = r.WithContext(context.WithValue(r.Context(), userKey, sub))
			}
			if admin, _ := claims["admin"].(bool); admin {
				r = r.WithContext(context.WithValue(r.Context(), adminKey, true))
			}
		}

		next(w, r)
	}
}

// seedUsers upserts the env-configured users (and their admin flag) into the
// users table. Existing rows are never overwritten (ON CONFLICT DO NOTHING),
// so a password changed at runtime survives restarts and the env value is only
// ever used to bootstrap a missing account.
func seedUsers(ctx context.Context) error {
	for username, hash := range users {
		if _, err := pool.Exec(ctx,
			`INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3)
			 ON CONFLICT (username) DO NOTHING`,
			username, hash, adminUsers[username],
		); err != nil {
			return err
		}
	}
	return nil
}

// handleChangePassword lets any authenticated user change their own password
// after re-supplying the current one.
func handleChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	username := userFromContext(r.Context())
	if username == "" {
		writeError(w, http.StatusUnauthorized, "missing token")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	var body struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if len(body.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "new password must be at least 8 characters")
		return
	}

	var hash string
	if err := pool.QueryRow(r.Context(),
		`SELECT password FROM users WHERE username = $1`, username).Scan(&hash); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.OldPassword)) != nil {
		writeError(w, http.StatusUnauthorized, "current password incorrect")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(body.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("hash password", "err", err)
		writeError(w, http.StatusInternalServerError, "hash error")
		return
	}
	if _, err := pool.Exec(r.Context(),
		`UPDATE users SET password = $1 WHERE username = $2`, string(newHash), username,
	); err != nil {
		writeError(w, http.StatusInternalServerError, "update: "+err.Error())
		return
	}

	slog.Info("password changed", "user", username)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
