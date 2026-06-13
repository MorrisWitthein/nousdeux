package main

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5"
)

// suggestionCols is the column list for event_suggestions in struct field order,
// so pgx.RowToStructByPos[EventSuggestion] scans it positionally.
const suggestionCols = `id, title, COALESCE(date,''), COALESCE(end_date,''),
	COALESCE(time,''), COALESCE(badge,''), COALESCE(badge_type,''),
	suggested_by, status, created_at, resolved_at`

// handleEventSuggestions is the collection endpoint: GET lists pending
// suggestions directed at the current user (i.e. created by the other user),
// POST creates a new suggestion attributed to the current user.
func (app *App) handleEventSuggestions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		// With two users, "for me" means any pending suggestion I did not make.
		user := userFromContext(ctx)
		rows, err := app.pool.Query(ctx,
			`SELECT `+suggestionCols+`
			 FROM event_suggestions
			 WHERE status = 'pending' AND suggested_by <> $1
			 ORDER BY created_at DESC`, user)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[EventSuggestion])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		var s EventSuggestion
		if !decodeBody(w, r, &s, 1<<20) {
			return
		}
		if s.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		// Reuse the event validator so a suggestion can always become an event.
		if err := validateEvent(suggestionAsEvent(s)); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		s.SuggestedBy = userFromContext(ctx)
		s.Status = "pending"
		err := app.pool.QueryRow(ctx,
			`INSERT INTO event_suggestions (title, date, end_date, time, badge, badge_type, suggested_by)
			 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
			s.Title, nullIfEmpty(s.Date), nullIfEmpty(s.EndDate), nullIfEmpty(s.Time),
			nullIfEmpty(s.Badge), nullIfEmpty(s.BadgeType), s.SuggestedBy,
		).Scan(&s.ID, &s.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("event suggestion created", "id", s.ID, "title", s.Title, "by", s.SuggestedBy)
		app.suggestionsBroker.Notify()
		writeJSON(w, http.StatusCreated, s)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// handleSuggestionAccept promotes a pending suggestion into a real event and
// marks it accepted. It is idempotent: the status guard means a suggestion that
// is already resolved creates no additional event.
func (app *App) handleSuggestionAccept(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}
	ctx := r.Context()

	tx, err := app.pool.Begin(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "begin: "+err.Error())
		return
	}
	defer tx.Rollback(ctx)

	// Flip pending → accepted atomically; only the first accept matches the WHERE
	// clause, so re-accepting (or accepting an unknown id) returns no row and we
	// create no event.
	var s EventSuggestion
	err = tx.QueryRow(ctx,
		`UPDATE event_suggestions SET status = 'accepted', resolved_at = now()
		 WHERE id = $1 AND status = 'pending'
		 RETURNING title, COALESCE(date,''), COALESCE(end_date,''), COALESCE(time,''),
		           COALESCE(badge,''), COALESCE(badge_type,''), suggested_by`,
		id).Scan(&s.Title, &s.Date, &s.EndDate, &s.Time, &s.Badge, &s.BadgeType, &s.SuggestedBy)
	if errors.Is(err, pgx.ErrNoRows) {
		// Already resolved or unknown id — nothing to create, succeed idempotently.
		writeJSON(w, http.StatusOK, map[string]string{"status": "noop"})
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "accept: "+err.Error())
		return
	}

	// Attribution: the created event carries the original suggester as `who`, so
	// it reads as their event on the shared calendar.
	_, err = tx.Exec(ctx,
		`INSERT INTO events (title, date, end_date, time, who, badge, badge_type)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		s.Title, nullIfEmpty(s.Date), nullIfEmpty(s.EndDate), nullIfEmpty(s.Time),
		s.SuggestedBy, nullIfEmpty(s.Badge), nullIfEmpty(s.BadgeType),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "insert event: "+err.Error())
		return
	}

	if err := tx.Commit(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "commit: "+err.Error())
		return
	}
	slog.Info("event suggestion accepted", "id", id)
	// Refresh both surfaces: the notifications list and the calendar.
	app.suggestionsBroker.Notify()
	app.eventsBroker.Notify()
	writeJSON(w, http.StatusOK, map[string]string{"accepted": id})
}

// handleSuggestionDecline marks a pending suggestion declined without creating
// an event. It is idempotent: declining an already-resolved suggestion is a no-op.
func (app *App) handleSuggestionDecline(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}
	ctx := r.Context()

	_, err := app.pool.Exec(ctx,
		`UPDATE event_suggestions SET status = 'declined', resolved_at = now()
		 WHERE id = $1 AND status = 'pending'`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "decline: "+err.Error())
		return
	}
	slog.Info("event suggestion declined", "id", id)
	app.suggestionsBroker.Notify()
	writeJSON(w, http.StatusOK, map[string]string{"declined": id})
}

// suggestionAsEvent adapts a suggestion to an Event so validateEvent can vet it.
func suggestionAsEvent(s EventSuggestion) Event {
	return Event{
		Title:     s.Title,
		Date:      s.Date,
		EndDate:   s.EndDate,
		Time:      s.Time,
		Badge:     s.Badge,
		BadgeType: s.BadgeType,
	}
}
