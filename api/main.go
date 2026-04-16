package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/mwitthein/nosdeux-api/sse"
	"golang.org/x/crypto/bcrypt"
)

// Event mirrors the DB schema from PLAN.md.
type Event struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Date      string `json:"date,omitempty"`
	Time      string `json:"time,omitempty"`
	Who       string `json:"who"`
	Badge     string `json:"badge,omitempty"`
	BadgeType string `json:"badgeType,omitempty"`
	CreatedAt string `json:"created_at"`
}

// Recipe mirrors the DB schema from PLAN.md.
type Recipe struct {
	ID        string   `json:"id"`
	Emoji     string   `json:"emoji,omitempty"`
	Title     string   `json:"title"`
	Tags      []string `json:"tags,omitempty"`
	Who       string   `json:"who"`
	Rating    string   `json:"rating,omitempty"`
	CreatedAt string   `json:"created_at"`
}

// Series mirrors the DB schema from PLAN.md.
type Series struct {
	ID         string `json:"id"`
	Emoji      string `json:"emoji,omitempty"`
	Title      string `json:"title"`
	Sub        string `json:"sub,omitempty"`
	Progress   int    `json:"progress"`
	Status     string `json:"status,omitempty"`
	StatusType string `json:"statusType,omitempty"`
	CreatedAt  string `json:"created_at"`
}

// Activity mirrors the DB schema from PLAN.md.
type Activity struct {
	ID        string `json:"id"`
	Emoji     string `json:"emoji,omitempty"`
	Title     string `json:"title"`
	Meta      string `json:"meta,omitempty"`
	Who       string `json:"who"`
	CreatedAt string `json:"created_at"`
}

var (
	mu         sync.RWMutex
	events     []Event
	recipes    []Recipe
	series     []Series
	activities []Activity

	eventsBroker     = sse.NewBroker()
	recipesBroker    = sse.NewBroker()
	seriesBroker     = sse.NewBroker()
	activitiesBroker = sse.NewBroker()

	jwtSecret []byte
	users     map[string]string // username → bcrypt hash
)

// writeJSON sends a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("encode response", "err", err)
	}
}

// writeError sends a JSON error response.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// cors wraps a handler with permissive CORS headers for local dev.
func cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

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

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": creds.Username,
		"exp": time.Now().Add(15 * 24 * time.Hour).Unix(),
	})
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

		_, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			return jwtSecret, nil
		}, jwt.WithValidMethods([]string{"HS256"}))
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		next(w, r)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Event, len(events))
		copy(out, events)
		mu.RUnlock()
		// Newest first.
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB limit
		var e Event
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if e.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if e.Who == "" {
			writeError(w, http.StatusBadRequest, "who is required")
			return
		}
		e.ID = uuid.New().String()
		e.CreatedAt = time.Now().UTC().Format(time.RFC3339)

		mu.Lock()
		events = append(events, e)
		mu.Unlock()

		slog.Info("event created", "id", e.ID, "title", e.Title)
		eventsBroker.Notify()
		writeJSON(w, http.StatusCreated, e)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleRecipes(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Recipe, len(recipes))
		copy(out, recipes)
		mu.RUnlock()
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var rec Recipe
		if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if rec.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if rec.Who == "" {
			writeError(w, http.StatusBadRequest, "who is required")
			return
		}
		rec.ID = uuid.New().String()
		rec.CreatedAt = time.Now().UTC().Format(time.RFC3339)
		if rec.Rating == "" {
			rec.Rating = "–"
		}

		mu.Lock()
		recipes = append(recipes, rec)
		mu.Unlock()

		slog.Info("recipe created", "id", rec.ID, "title", rec.Title)
		recipesBroker.Notify()
		writeJSON(w, http.StatusCreated, rec)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleSeries(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Series, len(series))
		copy(out, series)
		mu.RUnlock()
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var s Series
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if s.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		s.ID = uuid.New().String()
		s.CreatedAt = time.Now().UTC().Format(time.RFC3339)
		if s.Status == "" {
			s.Status = "Geplant"
		}
		if s.StatusType == "" {
			s.StatusType = "yellow"
		}

		mu.Lock()
		series = append(series, s)
		mu.Unlock()

		slog.Info("series created", "id", s.ID, "title", s.Title)
		seriesBroker.Notify()
		writeJSON(w, http.StatusCreated, s)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleActivities(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Activity, len(activities))
		copy(out, activities)
		mu.RUnlock()
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var a Activity
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if a.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if a.Who == "" {
			writeError(w, http.StatusBadRequest, "who is required")
			return
		}
		a.ID = uuid.New().String()
		a.CreatedAt = time.Now().UTC().Format(time.RFC3339)

		mu.Lock()
		activities = append(activities, a)
		mu.Unlock()

		slog.Info("activity created", "id", a.ID, "title", a.Title)
		activitiesBroker.Notify()
		writeJSON(w, http.StatusCreated, a)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func main() {
	addr := os.Getenv("API_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	// Load auth config from env.
	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		slog.Error("JWT_SECRET env var is required")
		os.Exit(1)
	}
	if raw := os.Getenv("USERS"); raw != "" {
		if err := json.Unmarshal([]byte(raw), &users); err != nil {
			slog.Error("USERS env var must be valid JSON", "err", err)
			os.Exit(1)
		}
	} else {
		slog.Error("USERS env var is required")
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/login", cors(handleLogin))
	mux.HandleFunc("/api/events", cors(requireAuth(handleEvents)))
	mux.HandleFunc("/api/recipes", cors(requireAuth(handleRecipes)))
	mux.HandleFunc("/api/series", cors(requireAuth(handleSeries)))
	mux.HandleFunc("/api/activities", cors(requireAuth(handleActivities)))
	mux.HandleFunc("/api/events/stream", cors(requireAuth(eventsBroker.ServeHTTP)))
	mux.HandleFunc("/api/recipes/stream", cors(requireAuth(recipesBroker.ServeHTTP)))
	mux.HandleFunc("/api/series/stream", cors(requireAuth(seriesBroker.ServeHTTP)))
	mux.HandleFunc("/api/activities/stream", cors(requireAuth(activitiesBroker.ServeHTTP)))

	srv := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout: 5 * time.Second,
		IdleTimeout: 60 * time.Second,
	}

	// Start server in background.
	go func() {
		slog.Info("nosdeux API listening", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	// Graceful shutdown on SIGTERM / SIGINT.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit

	slog.Info("shutting down gracefully...")
	eventsBroker.Shutdown()
	recipesBroker.Shutdown()
	seriesBroker.Shutdown()
	activitiesBroker.Shutdown()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "err", err)
		os.Exit(1)
	}
	slog.Info("server stopped")
}
