package main

import (
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
)

func (app *App) handleEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		listResource[Event](w, r, app.pool,
			`SELECT id, title, COALESCE(date,''), COALESCE(end_date,''), COALESCE(time,''),
			        who, COALESCE(badge,''), COALESCE(badge_type,''), created_at,
			        COALESCE(ac.c, 0)
			 FROM events
			 LEFT JOIN (SELECT event_id, COUNT(*) AS c FROM event_attachments GROUP BY event_id) ac
			   ON ac.event_id = events.id
			 ORDER BY created_at DESC`)

	case http.MethodPost:
		var e Event
		if !decodeBody(w, r, &e, 1<<20) {
			return
		}
		if e.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateEvent(e); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		e.Who = userFromContext(ctx)
		err := app.pool.QueryRow(ctx,
			`INSERT INTO events (title, date, end_date, time, who, badge, badge_type)
			 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
			e.Title, nullIfEmpty(e.Date), nullIfEmpty(e.EndDate), nullIfEmpty(e.Time), e.Who, nullIfEmpty(e.Badge), nullIfEmpty(e.BadgeType),
		).Scan(&e.ID, &e.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("event created", "id", e.ID, "title", e.Title)
		app.eventsBroker.Notify()
		writeJSON(w, http.StatusCreated, e)

	case http.MethodPatch:
		id, ok := requireID(w, r)
		if !ok {
			return
		}
		var e Event
		if !decodeBody(w, r, &e, 1<<20) {
			return
		}
		if e.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateEvent(e); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		tag, err := app.pool.Exec(ctx,
			`UPDATE events SET title=$1, date=$2, end_date=$3, time=$4, badge=$5, badge_type=$6
			 WHERE id=$7`,
			e.Title, nullIfEmpty(e.Date), nullIfEmpty(e.EndDate), nullIfEmpty(e.Time),
			nullIfEmpty(e.Badge), nullIfEmpty(e.BadgeType), id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("event updated", "id", id)
		app.eventsBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		app.deleteResource(w, r, "events", app.eventsBroker, func(id string) {
			os.RemoveAll(filepath.Join(attachmentsDir, id))
		})

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
