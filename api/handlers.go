package main

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5"
)

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, title, COALESCE(date,''), COALESCE(time,''),
			        who, COALESCE(badge,''), COALESCE(badge_type,''), created_at
			 FROM events ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Event])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var e Event
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if e.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		e.Who = userFromContext(ctx)
		err := pool.QueryRow(ctx,
			`INSERT INTO events (title, date, time, who, badge, badge_type)
			 VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
			e.Title, nullIfEmpty(e.Date), nullIfEmpty(e.Time), e.Who, nullIfEmpty(e.Badge), nullIfEmpty(e.BadgeType),
		).Scan(&e.ID, &e.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("event created", "id", e.ID, "title", e.Title)
		eventsBroker.Notify()
		writeJSON(w, http.StatusCreated, e)

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM events WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("event deleted", "id", id)
		eventsBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleRecipes(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(tags,'{}'),
			        who, COALESCE(rating,'–'), created_at
			 FROM recipes ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Recipe])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
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
		rec.Who = userFromContext(ctx)
		err := pool.QueryRow(ctx,
			`INSERT INTO recipes (emoji, title, tags, who, rating)
			 VALUES ($1,$2,$3,$4,$5) RETURNING id, COALESCE(rating,'–'), created_at`,
			nullIfEmpty(rec.Emoji), rec.Title, rec.Tags, rec.Who, nullIfEmpty(rec.Rating),
		).Scan(&rec.ID, &rec.Rating, &rec.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("recipe created", "id", rec.ID, "title", rec.Title)
		recipesBroker.Notify()
		writeJSON(w, http.StatusCreated, rec)

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM recipes WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("recipe deleted", "id", id)
		recipesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleSeries(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(sub,''),
			        COALESCE(progress,0), COALESCE(status,'Geplant'),
			        COALESCE(status_type,'yellow'), created_at
			 FROM series ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Series])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
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
		err := pool.QueryRow(ctx,
			`INSERT INTO series (emoji, title, sub, progress, status, status_type)
			 VALUES ($1,$2,$3,$4,$5,$6)
			 RETURNING id, COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'), created_at`,
			nullIfEmpty(s.Emoji), s.Title, nullIfEmpty(s.Sub), s.Progress,
			nullIfEmpty(s.Status), nullIfEmpty(s.StatusType),
		).Scan(&s.ID, &s.Status, &s.StatusType, &s.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("series created", "id", s.ID, "title", s.Title)
		seriesBroker.Notify()
		writeJSON(w, http.StatusCreated, s)

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM series WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("series deleted", "id", id)
		seriesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleActivities(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(meta,''),
			        who, created_at
			 FROM activities ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Activity])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
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
		a.Who = userFromContext(ctx)
		err := pool.QueryRow(ctx,
			`INSERT INTO activities (emoji, title, meta, who)
			 VALUES ($1,$2,$3,$4) RETURNING id, created_at`,
			nullIfEmpty(a.Emoji), a.Title, nullIfEmpty(a.Meta), a.Who,
		).Scan(&a.ID, &a.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("activity created", "id", a.ID, "title", a.Title)
		activitiesBroker.Notify()
		writeJSON(w, http.StatusCreated, a)

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM activities WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("activity deleted", "id", id)
		activitiesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// nullIfEmpty returns nil for empty strings so Postgres uses the column DEFAULT.
func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
