package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
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
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
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
	adminUsers = map[string]bool{}
	for _, name := range strings.Fields(strings.ReplaceAll(os.Getenv("ADMINS"), ",", " ")) {
		adminUsers[name] = true
	}

	// Attachments storage directory.
	attachmentsDir = os.Getenv("ATTACHMENTS_DIR")
	if attachmentsDir == "" {
		attachmentsDir = "/data/attachments"
	}
	if err := os.MkdirAll(attachmentsDir, 0o755); err != nil {
		slog.Error("cannot create attachments dir", "dir", attachmentsDir, "err", err)
		os.Exit(1)
	}

	// Connect to Postgres.
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		slog.Error("DB_DSN env var is required")
		os.Exit(1)
	}
	pool, err := db.Connect(context.Background(), dsn)
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

	app := newApp(pool, jwtSecret)

	// Seed env-configured users into the DB (no-op once they exist).
	if err := app.seedUsers(context.Background()); err != nil {
		slog.Error("seed users failed", "err", err)
		os.Exit(1)
	}

	cleanupCtx, cleanupCancel := context.WithCancel(context.Background())
	defer cleanupCancel()
	app.startCleanupWorker(cleanupCtx)

	// Routes.
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/login", cors(app.handleLogin))
	mux.HandleFunc("/api/me/password", cors(app.requireAuth(app.handleChangePassword)))
	mux.HandleFunc("/api/events", cors(app.requireAuth(app.handleEvents)))
	mux.HandleFunc("/api/recipes", cors(app.requireAuth(app.handleRecipes)))
	mux.HandleFunc("/api/recipes/import", cors(app.requireAuth(handleRecipeImport)))
	mux.HandleFunc("/api/recipes/image", cors(app.requireAuth(app.handleRecipeImage)))
	mux.HandleFunc("/api/recipes/{id}/upload-image", cors(app.requireAuth(app.handleRecipeUploadImage)))
	mux.HandleFunc("/api/recipes/{id}/image-file", cors(handleRecipeImageFile))
	mux.HandleFunc("/api/series", cors(app.requireAuth(app.handleSeries)))
	mux.HandleFunc("/api/series/image", cors(app.requireAuth(app.handleListImage("series", "tv", app.seriesBroker))))
	mux.HandleFunc("/api/activities", cors(app.requireAuth(app.handleActivities)))
	mux.HandleFunc("/api/movies", cors(app.requireAuth(app.handleMovies)))
	mux.HandleFunc("/api/movies/image", cors(app.requireAuth(app.handleListImage("movies", "movie", app.moviesBroker))))
	mux.HandleFunc("/api/weather", cors(app.requireAuth(handleWeather)))
	mux.HandleFunc("/api/events/{id}/attachments", cors(app.requireAuth(app.handleEventAttachments)))
	mux.HandleFunc("/api/attachments/{id}", cors(app.requireAuth(app.handleAttachment)))
	mux.HandleFunc("/api/events/stream", cors(app.requireAuth(app.eventsBroker.ServeHTTP)))
	mux.HandleFunc("/api/recipes/stream", cors(app.requireAuth(app.recipesBroker.ServeHTTP)))
	mux.HandleFunc("/api/series/stream", cors(app.requireAuth(app.seriesBroker.ServeHTTP)))
	mux.HandleFunc("/api/activities/stream", cors(app.requireAuth(app.activitiesBroker.ServeHTTP)))
	mux.HandleFunc("/api/movies/stream", cors(app.requireAuth(app.moviesBroker.ServeHTTP)))
	mux.HandleFunc("/api/shopping", cors(app.requireAuth(app.handleShoppingList)))
	mux.HandleFunc("/api/shopping/history", cors(app.requireAuth(app.handleShoppingHistory)))
	mux.HandleFunc("/api/shopping/stream", cors(app.requireAuth(app.shoppingBroker.ServeHTTP)))
	mux.HandleFunc("/api/settings", cors(app.requireAuth(app.handleSettings)))

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
	app.eventsBroker.Shutdown()
	app.recipesBroker.Shutdown()
	app.seriesBroker.Shutdown()
	app.activitiesBroker.Shutdown()
	app.moviesBroker.Shutdown()
	app.shoppingBroker.Shutdown()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "err", err)
		os.Exit(1)
	}
	slog.Info("server stopped")
}
