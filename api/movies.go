package main

import (
	"log/slog"
	"net/http"
)

func (app *App) handleMovies(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		listResource[Movie](w, r, app.pool,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(sub,''),
			        COALESCE(genres,'{}'), COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'),
			        COALESCE(rating,0), COALESCE(who,''), COALESCE(image_url,''), created_at
			 FROM movies ORDER BY created_at DESC`)

	case http.MethodPost:
		var m Movie
		if !decodeBody(w, r, &m, 1<<20) {
			return
		}
		if m.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateMovie(m); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		genres := m.Genres
		if genres == nil {
			genres = []string{}
		}
		m.Who = userFromContext(ctx)
		err := app.pool.QueryRow(ctx,
			`INSERT INTO movies (emoji, title, sub, genres, status, status_type, rating, who)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			 RETURNING id, COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'), created_at`,
			nullIfEmpty(m.Emoji), m.Title, nullIfEmpty(m.Sub), genres,
			nullIfEmpty(m.Status), nullIfEmpty(m.StatusType), m.Rating, m.Who,
		).Scan(&m.ID, &m.Status, &m.StatusType, &m.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("movie created", "id", m.ID, "title", m.Title)
		app.moviesBroker.Notify()
		writeJSON(w, http.StatusCreated, m)

	case http.MethodPatch:
		id, ok := requireID(w, r)
		if !ok {
			return
		}
		var m Movie
		if !decodeBody(w, r, &m, 1<<20) {
			return
		}
		if m.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateMovie(m); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		patchGenres := m.Genres
		if patchGenres == nil {
			patchGenres = []string{}
		}
		tag, err := app.pool.Exec(ctx,
			`UPDATE movies SET emoji=$1, title=$2, sub=$3, genres=$4, status=$5, status_type=$6, rating=$7
			 WHERE id=$8`,
			nullIfEmpty(m.Emoji), m.Title, nullIfEmpty(m.Sub), patchGenres,
			nullIfEmpty(m.Status), nullIfEmpty(m.StatusType), m.Rating, id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("movie updated", "id", id)
		app.moviesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		app.deleteResource(w, r, "movies", app.moviesBroker, nil)

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
