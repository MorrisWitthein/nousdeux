package main

import (
	"log/slog"
	"net/http"
)

func (app *App) handleActivities(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		listResource[Activity](w, r, app.pool,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(meta,''),
			        who, COALESCE(date,''), COALESCE(time,''), COALESCE(status,'Idee'), created_at
			 FROM activities ORDER BY created_at DESC`)

	case http.MethodPost:
		var a Activity
		if !decodeBody(w, r, &a, 1<<20) {
			return
		}
		if a.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateActivity(a); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		a.Who = userFromContext(ctx)
		err := app.pool.QueryRow(ctx,
			`INSERT INTO activities (emoji, title, meta, who, date, time, status)
			 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
			nullIfEmpty(a.Emoji), a.Title, nullIfEmpty(a.Meta), a.Who,
			nullIfEmpty(a.Date), nullIfEmpty(a.Time), nullIfEmpty(a.Status),
		).Scan(&a.ID, &a.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("activity created", "id", a.ID, "title", a.Title)
		app.activitiesBroker.Notify()
		writeJSON(w, http.StatusCreated, a)

	case http.MethodPatch:
		id, ok := requireID(w, r)
		if !ok {
			return
		}
		var a Activity
		if !decodeBody(w, r, &a, 1<<20) {
			return
		}
		if a.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateActivity(a); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		tag, err := app.pool.Exec(ctx,
			`UPDATE activities SET emoji=$1, title=$2, meta=$3, date=$4, time=$5, status=$6
			 WHERE id=$7`,
			nullIfEmpty(a.Emoji), a.Title, nullIfEmpty(a.Meta),
			nullIfEmpty(a.Date), nullIfEmpty(a.Time), nullIfEmpty(a.Status), id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("activity updated", "id", id)
		app.activitiesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		app.deleteResource(w, r, "activities", app.activitiesBroker, nil)

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
