package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// seedTestUser inserts a user with the given plaintext password (bcrypt-hashed)
// into the test schema, returning a cleanup that removes it.
func seedTestUser(t *testing.T, app *App, username, password string, admin bool) {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	if _, err := app.pool.Exec(t.Context(),
		`INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3)
		 ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, is_admin = EXCLUDED.is_admin`,
		username, string(hash), admin); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() {
		app.pool.Exec(t.Context(), `DELETE FROM users WHERE username = $1`, username)
	})
}

func postLogin(app *App, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	app.handleLogin(rr, req)
	return rr
}

func TestHandleLoginValid(t *testing.T) {
	app := newTestApp(t)
	seedTestUser(t, app, "max", "correct-horse", false)

	rr := postLogin(app, `{"username":"max","password":"correct-horse"}`)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	if err := decodeJSON(rr, &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["token"] == "" {
		t.Fatal("expected a non-empty token")
	}

	// The token must validate against the app secret and carry sub=max.
	tok, err := jwt.Parse(resp["token"], func(*jwt.Token) (any, error) {
		return app.jwtSecret, nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		t.Fatalf("returned token does not validate: %v", err)
	}
	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("unexpected claims type")
	}
	if sub, _ := claims["sub"].(string); sub != "max" {
		t.Fatalf("expected sub 'max', got %q", sub)
	}
}

func TestHandleLoginInvalid(t *testing.T) {
	app := newTestApp(t)
	seedTestUser(t, app, "max", "correct-horse", false)

	cases := []struct {
		name string
		body string
	}{
		{"unknown username", `{"username":"nobody","password":"correct-horse"}`},
		{"wrong password", `{"username":"max","password":"wrong"}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rr := postLogin(app, tc.body)
			if rr.Code != http.StatusUnauthorized {
				t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
			}
			var resp map[string]string
			if err := decodeJSON(rr, &resp); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if resp["token"] != "" {
				t.Fatal("expected no token on failed login")
			}
			if resp["error"] == "" {
				t.Fatalf("expected an error message, got %v", resp)
			}
		})
	}
}
