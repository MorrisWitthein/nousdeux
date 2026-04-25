package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mwitthein/nousdeux-api/db"
)

var version = "dev"

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

	// Connect to Postgres.
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		slog.Error("DB_DSN env var is required")
		os.Exit(1)
	}
	var err error
	pool, err = db.Connect(context.Background(), dsn)
	if err != nil {
		slog.Error("database connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := db.Migrate(context.Background(), pool); err != nil {
		slog.Error("database migration failed", "err", err)
		os.Exit(1)
	}
	slog.Info("database ready")

	// Routes.
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/login", cors(handleLogin))
	mux.HandleFunc("/api/events", cors(requireAuth(handleEvents)))
	mux.HandleFunc("/api/recipes", cors(requireAuth(handleRecipes)))
	mux.HandleFunc("/api/recipes/image", cors(requireAuth(handleRecipeImage)))
	mux.HandleFunc("/api/series", cors(requireAuth(handleSeries)))
	mux.HandleFunc("/api/activities", cors(requireAuth(handleActivities)))
	mux.HandleFunc("/api/movies", cors(requireAuth(handleMovies)))
	mux.HandleFunc("/api/weather", cors(requireAuth(handleWeather)))
	mux.HandleFunc("/api/events/stream", cors(requireAuth(eventsBroker.ServeHTTP)))
	mux.HandleFunc("/api/recipes/stream", cors(requireAuth(recipesBroker.ServeHTTP)))
	mux.HandleFunc("/api/series/stream", cors(requireAuth(seriesBroker.ServeHTTP)))
	mux.HandleFunc("/api/activities/stream", cors(requireAuth(activitiesBroker.ServeHTTP)))
	mux.HandleFunc("/api/movies/stream", cors(requireAuth(moviesBroker.ServeHTTP)))

	srv := &http.Server{
		Addr:        addr,
		Handler:     mux,
		ReadTimeout: 5 * time.Second,
		IdleTimeout: 60 * time.Second,
	}

	// Start server in background.
	go func() {
		slog.Info("nousdeux API listening", "addr", addr, "version", version)
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
	moviesBroker.Shutdown()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "err", err)
		os.Exit(1)
	}
	slog.Info("server stopped")
}
