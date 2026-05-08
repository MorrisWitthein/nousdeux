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

	hash, ok := users[creds.Username]
	if !ok || bcrypt.CompareHashAndPassword([]byte(hash), []byte(creds.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	claims := jwt.MapClaims{
		"sub": creds.Username,
		"exp": time.Now().Add(15 * 24 * time.Hour).Unix(),
	}
	if adminUsers[creds.Username] {
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
