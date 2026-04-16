package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/google/uuid"
)

// Event mirrors the DB schema from PLAN.md.
type Event struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Date      string `json:"date,omitempty"`
	Time      string `json:"time,omitempty"`
	Who       string `json:"who"`
	Badge     string `json:"badge,omitempty"`
	BadgeType string `json:"badge_type,omitempty"`
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
	StatusType string `json:"status_type,omitempty"`
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

	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/events", cors(handleEvents))
	mux.HandleFunc("/api/recipes", cors(handleRecipes))
	mux.HandleFunc("/api/series", cors(handleSeries))
	mux.HandleFunc("/api/activities", cors(handleActivities))

	srv := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
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
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "err", err)
		os.Exit(1)
	}
	slog.Info("server stopped")
}
