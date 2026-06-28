package main

import (
	"log/slog"
	"net/http"
)

func (app *App) handleSeries(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		listResource[Series](w, r, app.pool,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(sub,''),
			        COALESCE(progress,0), COALESCE(season,0), COALESCE(total_seasons,0),
			        COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'),
			        COALESCE(rating,0), COALESCE(who,''), COALESCE(image_url,''), created_at
			 FROM series ORDER BY created_at DESC`)

	case http.MethodPost:
		var s Series
		if !decodeBody(w, r, &s, 1<<20) {
			return
		}
		if s.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateSeries(s); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		s.Who = userFromContext(ctx)
		err := app.pool.QueryRow(ctx,
			`INSERT INTO series (emoji, title, sub, progress, season, total_seasons, status, status_type, rating, who)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			 RETURNING id, COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'), created_at`,
			nullIfEmpty(s.Emoji), s.Title, nullIfEmpty(s.Sub), s.Progress, s.Season, s.TotalSeasons,
			nullIfEmpty(s.Status), nullIfEmpty(s.StatusType), s.Rating, s.Who,
		).Scan(&s.ID, &s.Status, &s.StatusType, &s.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("series created", "id", s.ID, "title", s.Title)
		app.seriesBroker.Notify()
		writeJSON(w, http.StatusCreated, s)

	case http.MethodPatch:
		id, ok := requireID(w, r)
		if !ok {
			return
		}
		var s Series
		if !decodeBody(w, r, &s, 1<<20) {
			return
		}
		if s.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateSeries(s); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		tag, err := app.pool.Exec(ctx,
			`UPDATE series SET emoji=$1, title=$2, sub=$3, progress=$4, season=$5, total_seasons=$6, status=$7, status_type=$8, rating=$9
			 WHERE id=$10`,
			nullIfEmpty(s.Emoji), s.Title, nullIfEmpty(s.Sub),
			s.Progress, s.Season, s.TotalSeasons, nullIfEmpty(s.Status), nullIfEmpty(s.StatusType), s.Rating, id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("series updated", "id", id)
		app.seriesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		app.deleteResource(w, r, "series", app.seriesBroker, nil)

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
