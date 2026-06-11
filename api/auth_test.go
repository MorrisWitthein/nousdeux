package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// testSecret is the HS256 signing key used by the auth unit tests. requireAuth
// only touches app.jwtSecret and the request context, so these tests need no DB.
var testSecret = []byte("test-secret-do-not-use-in-prod")

// makeToken signs a JWT with the given claims using method and secret, so tests
// can mint valid, expired, wrong-secret, and wrong-algorithm tokens.
func makeToken(t *testing.T, method jwt.SigningMethod, secret any, claims jwt.MapClaims) string {
	t.Helper()
	signed, err := jwt.NewWithClaims(method, claims).SignedString(secret)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return signed
}

// validToken returns an HS256 token signed with testSecret, expiring in 1h.
func validToken(t *testing.T, claims jwt.MapClaims) string {
	t.Helper()
	if _, ok := claims["exp"]; !ok {
		claims["exp"] = time.Now().Add(time.Hour).Unix()
	}
	return makeToken(t, jwt.SigningMethodHS256, testSecret, claims)
}

func TestRequireAuthValid(t *testing.T) {
	app := &App{jwtSecret: testSecret}

	t.Run("bearer token populates user context", func(t *testing.T) {
		var gotUser string
		var gotAdmin bool
		called := false
		h := app.requireAuth(func(w http.ResponseWriter, r *http.Request) {
			called = true
			gotUser = userFromContext(r.Context())
			gotAdmin = isAdminFromContext(r.Context())
		})

		req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
		req.Header.Set("Authorization", "Bearer "+validToken(t, jwt.MapClaims{"sub": "max"}))
		rr := httptest.NewRecorder()
		h(rr, req)

		if !called {
			t.Fatal("next handler was not called")
		}
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
		if gotUser != "max" {
			t.Fatalf("expected user 'max', got %q", gotUser)
		}
		if gotAdmin {
			t.Fatal("expected non-admin context")
		}
	})

	t.Run("token query param works", func(t *testing.T) {
		called := false
		var gotUser string
		h := app.requireAuth(func(w http.ResponseWriter, r *http.Request) {
			called = true
			gotUser = userFromContext(r.Context())
		})

		token := validToken(t, jwt.MapClaims{"sub": "lena"})
		req := httptest.NewRequest(http.MethodGet, "/api/events/stream?token="+token, nil)
		rr := httptest.NewRecorder()
		h(rr, req)

		if !called {
			t.Fatal("next handler was not called")
		}
		if gotUser != "lena" {
			t.Fatalf("expected user 'lena', got %q", gotUser)
		}
	})

	t.Run("admin claim sets admin context", func(t *testing.T) {
		var gotAdmin bool
		h := app.requireAuth(func(w http.ResponseWriter, r *http.Request) {
			gotAdmin = isAdminFromContext(r.Context())
		})

		req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
		req.Header.Set("Authorization", "Bearer "+validToken(t, jwt.MapClaims{"sub": "max", "admin": true}))
		rr := httptest.NewRecorder()
		h(rr, req)

		if !gotAdmin {
			t.Fatal("expected admin context to be true")
		}
	})
}

func TestRequireAuthRejects(t *testing.T) {
	app := &App{jwtSecret: testSecret}

	cases := []struct {
		name  string
		setup func(req *http.Request)
	}{
		{
			"missing token",
			func(req *http.Request) {},
		},
		{
			"non-JWT string",
			func(req *http.Request) {
				req.Header.Set("Authorization", "Bearer not-a-jwt")
			},
		},
		{
			"wrong signing secret",
			func(req *http.Request) {
				tok := makeToken(t, jwt.SigningMethodHS256, []byte("other-secret"),
					jwt.MapClaims{"sub": "max", "exp": time.Now().Add(time.Hour).Unix()})
				req.Header.Set("Authorization", "Bearer "+tok)
			},
		},
		{
			"non-HS256 algorithm",
			func(req *http.Request) {
				// "none" alg token — must be rejected by WithValidMethods.
				tok := makeToken(t, jwt.SigningMethodNone, jwt.UnsafeAllowNoneSignatureType,
					jwt.MapClaims{"sub": "max", "exp": time.Now().Add(time.Hour).Unix()})
				req.Header.Set("Authorization", "Bearer "+tok)
			},
		},
		{
			"expired token",
			func(req *http.Request) {
				tok := makeToken(t, jwt.SigningMethodHS256, testSecret,
					jwt.MapClaims{"sub": "max", "exp": time.Now().Add(-time.Hour).Unix()})
				req.Header.Set("Authorization", "Bearer "+tok)
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			called := false
			h := app.requireAuth(func(w http.ResponseWriter, r *http.Request) {
				called = true
			})

			req := httptest.NewRequest(http.MethodGet, "/api/events", nil)
			tc.setup(req)
			rr := httptest.NewRecorder()
			h(rr, req)

			if called {
				t.Fatal("next handler must not be called on rejected auth")
			}
			if rr.Code != http.StatusUnauthorized {
				t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
			}
			var resp map[string]string
			if err := decodeJSON(rr, &resp); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if resp["error"] == "" {
				t.Fatalf("expected an error message, got %v", resp)
			}
		})
	}
}
