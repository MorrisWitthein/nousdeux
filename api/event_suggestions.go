package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// suggestionCols is the column list for event_suggestions in struct field order,
// so pgx.RowToStructByPos[EventSuggestion] scans it positionally.
const suggestionCols = `id, title, COALESCE(date,''), COALESCE(end_date,''),
	COALESCE(time,''), COALESCE(badge,''), COALESCE(badge_type,''),
	suggested_by, status, created_at, resolved_at,
	COALESCE(awaiting,''), COALESCE(last_proposed_by,'')`

// awaitingMe is the SQL predicate (with $1 = current user) for a pending
// suggestion that is the current user's turn to act on. Routing is name-free:
// "recipient" means the non-suggester, "sender" means the original suggester.
const awaitingMe = `status = 'pending' AND (
	(awaiting = 'recipient' AND suggested_by <> $1) OR
	(awaiting = 'sender'    AND suggested_by =  $1))`

// handleEventSuggestions is the collection endpoint. GET returns the two lists
// that drive the UI — `received` (pending and awaiting me) and `sent` (threads I
// started, minus any currently in my received queue) — in one response. POST
// creates a new suggestion attributed to, and initiated by, the current user.
func (app *App) handleEventSuggestions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		user := userFromContext(ctx)
		received, err := querySuggestions(ctx, app.pool,
			`SELECT `+suggestionCols+` FROM event_suggestions
			 WHERE `+awaitingMe+` ORDER BY created_at DESC`, user)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		// Sent = threads I started, excluding ones now back in my action queue
		// (those show under received instead, so they are not listed twice).
		sent, err := querySuggestions(ctx, app.pool,
			`SELECT `+suggestionCols+` FROM event_suggestions
			 WHERE suggested_by = $1 AND NOT (`+awaitingMe+`)
			 ORDER BY created_at DESC`, user)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string][]EventSuggestion{
			"received": received,
			"sent":     sent,
		})

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
		s.Awaiting = "recipient"
		s.LastProposedBy = s.SuggestedBy
		err := app.pool.QueryRow(ctx,
			`INSERT INTO event_suggestions
			   (title, date, end_date, time, badge, badge_type, suggested_by, awaiting, last_proposed_by)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,'recipient',$7) RETURNING id, created_at`,
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

// handleSuggestionAccept promotes a pending suggestion into a real event using
// its currently-proposed fields and marks it accepted. It is idempotent and
// turn-aware: only the user whose turn it is can accept, and the status guard
// means re-accepting creates no additional event.
func (app *App) handleSuggestionAccept(w http.ResponseWriter, r *http.Request) {
	id, ok := suggestionActionID(w, r)
	if !ok {
		return
	}
	ctx := r.Context()
	user := userFromContext(ctx)

	tx, err := app.pool.Begin(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "begin: "+err.Error())
		return
	}
	defer tx.Rollback(ctx)

	// Flip pending → accepted atomically; only a row that is open and awaiting
	// this user matches, so re-accepting (or an unknown id) creates no event.
	var s EventSuggestion
	err = tx.QueryRow(ctx,
		`UPDATE event_suggestions SET status = 'accepted', resolved_at = now(), awaiting = NULL
		 WHERE id = $2 AND `+awaitingMe+`
		 RETURNING title, COALESCE(date,''), COALESCE(end_date,''), COALESCE(time,''),
		           COALESCE(badge,''), COALESCE(badge_type,''), suggested_by`,
		user, id).Scan(&s.Title, &s.Date, &s.EndDate, &s.Time, &s.Badge, &s.BadgeType, &s.SuggestedBy)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "noop"})
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "accept: "+err.Error())
		return
	}

	// The created event carries the original suggester as `who`, so it reads as
	// their event on the shared calendar regardless of who countered.
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
	slog.Info("event suggestion accepted", "id", id, "by", user)
	app.suggestionsBroker.Notify()
	app.eventsBroker.Notify()
	writeJSON(w, http.StatusOK, map[string]string{"accepted": id})
}

// handleSuggestionDecline marks a pending suggestion declined without creating
// an event. Only the user whose turn it is can decline; it is idempotent.
func (app *App) handleSuggestionDecline(w http.ResponseWriter, r *http.Request) {
	id, ok := suggestionActionID(w, r)
	if !ok {
		return
	}
	ctx := r.Context()
	user := userFromContext(ctx)

	_, err := app.pool.Exec(ctx,
		`UPDATE event_suggestions SET status = 'declined', resolved_at = now(), awaiting = NULL
		 WHERE id = $2 AND `+awaitingMe, user, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "decline: "+err.Error())
		return
	}
	slog.Info("event suggestion declined", "id", id, "by", user)
	app.suggestionsBroker.Notify()
	writeJSON(w, http.StatusOK, map[string]string{"declined": id})
}

// handleSuggestionCounter records a counter-proposal: the user whose turn it is
// proposes a different date/time, which bounces the suggestion back to the other
// party (awaiting flips) and updates who last proposed.
func (app *App) handleSuggestionCounter(w http.ResponseWriter, r *http.Request) {
	id, ok := suggestionActionID(w, r)
	if !ok {
		return
	}
	ctx := r.Context()
	user := userFromContext(ctx)

	var body struct {
		Date    string `json:"date"`
		EndDate string `json:"endDate"`
		Time    string `json:"time"`
	}
	if !decodeBody(w, r, &body, 1<<20) {
		return
	}
	// Validate as an event (date required, formats, end after start) so the
	// counter stays acceptable into the events table later.
	if err := validateEvent(Event{Date: body.Date, EndDate: body.EndDate, Time: body.Time}); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Flip turns: after I counter, it is the other party's turn. Relative to
	// suggested_by, that is 'recipient' when I am the suggester, else 'sender'.
	tag, err := app.pool.Exec(ctx,
		`UPDATE event_suggestions
		   SET date = $3, end_date = $4, time = $5, last_proposed_by = $1,
		       awaiting = CASE WHEN suggested_by = $1 THEN 'recipient' ELSE 'sender' END
		 WHERE id = $2 AND `+awaitingMe,
		user, id, body.Date, nullIfEmpty(body.EndDate), nullIfEmpty(body.Time))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "counter: "+err.Error())
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusConflict, "Vorschlag ist nicht mehr offen")
		return
	}
	slog.Info("event suggestion countered", "id", id, "by", user)
	app.suggestionsBroker.Notify()
	writeJSON(w, http.StatusOK, map[string]string{"countered": id})
}

// suggestionActionID enforces POST + a path id for the accept/decline/counter
// action endpoints, writing the appropriate error and returning ok=false.
func suggestionActionID(w http.ResponseWriter, r *http.Request) (string, bool) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return "", false
	}
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id is required")
		return "", false
	}
	return id, true
}

// querySuggestions runs a suggestions query with a single user arg and scans the
// rows positionally into a (never-nil) slice.
func querySuggestions(ctx context.Context, pool *pgxpool.Pool, query, user string) ([]EventSuggestion, error) {
	rows, err := pool.Query(ctx, query, user)
	if err != nil {
		return nil, errors.New("query: " + err.Error())
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[EventSuggestion])
	if err != nil {
		return nil, errors.New("scan: " + err.Error())
	}
	return out, nil
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
