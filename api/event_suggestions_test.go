package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// createSuggestion posts a suggestion as user and returns the created row.
func createSuggestion(t *testing.T, app *App, user, body string) EventSuggestion {
	t.Helper()
	req := authedRequest(http.MethodPost, "/api/event-suggestions", body, user)
	rr := httptest.NewRecorder()
	app.handleEventSuggestions(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("create expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var s EventSuggestion
	if err := decodeJSON(rr, &s); err != nil {
		t.Fatalf("create decode: %v", err)
	}
	return s
}

// listSuggestions returns the pending suggestions visible to user.
func listSuggestions(t *testing.T, app *App, user string) []EventSuggestion {
	t.Helper()
	req := authedRequest(http.MethodGet, "/api/event-suggestions", "", user)
	rr := httptest.NewRecorder()
	app.handleEventSuggestions(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("list expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var out []EventSuggestion
	if err := decodeJSON(rr, &out); err != nil {
		t.Fatalf("list decode: %v", err)
	}
	return out
}

// countEvents returns how many events currently exist.
func countEvents(t *testing.T, app *App) int {
	t.Helper()
	var n int
	if err := app.pool.QueryRow(t.Context(), `SELECT COUNT(*) FROM events`).Scan(&n); err != nil {
		t.Fatalf("count events: %v", err)
	}
	return n
}

func TestSuggestionCreateAttributionAndNotify(t *testing.T) {
	app := newTestApp(t)

	notified := subscribe(t, app.suggestionsBroker)
	s := createSuggestion(t, app, "max", `{"title":"Kino","date":"2026-07-04","badgeType":"green"}`)
	if s.ID == "" {
		t.Fatal("expected a generated id")
	}
	if s.SuggestedBy != "max" {
		t.Fatalf("expected suggestedBy 'max', got %q", s.SuggestedBy)
	}
	if s.Status != "pending" {
		t.Fatalf("expected status 'pending', got %q", s.Status)
	}
	if !notified() {
		t.Fatal("expected the suggestions broker to be notified on create")
	}
}

func TestSuggestionCreateValidation(t *testing.T) {
	app := newTestApp(t)

	cases := []struct{ name, body, wantMsg string }{
		{"missing title", `{"date":"2026-07-04"}`, "title is required"},
		{"missing date", `{"title":"x"}`, "date is required"},
		{"bad date", `{"title":"x","date":"04-07-2026"}`, "date must be YYYY-MM-DD"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := authedRequest(http.MethodPost, "/api/event-suggestions", tc.body, "max")
			rr := httptest.NewRecorder()
			app.handleEventSuggestions(rr, req)
			assertBadRequest(t, rr, tc.wantMsg)
		})
	}
}

func TestSuggestionListFiltersOwnAndPending(t *testing.T) {
	app := newTestApp(t)

	s := createSuggestion(t, app, "max", `{"title":"Kino","date":"2026-07-04"}`)

	// The other user sees it; the suggester does not.
	if got := listSuggestions(t, app, "lena"); !containsSuggestion(got, s.ID) {
		t.Fatal("expected lena to see max's pending suggestion")
	}
	if got := listSuggestions(t, app, "max"); containsSuggestion(got, s.ID) {
		t.Fatal("expected max NOT to see their own suggestion")
	}

	// Once resolved it leaves the pending list.
	declineSuggestion(t, app, "lena", s.ID, http.StatusOK)
	if got := listSuggestions(t, app, "lena"); containsSuggestion(got, s.ID) {
		t.Fatal("expected a declined suggestion to leave the list")
	}
}

func TestSuggestionAcceptCreatesOneEventIdempotent(t *testing.T) {
	app := newTestApp(t)

	before := countEvents(t, app)
	s := createSuggestion(t, app, "max", `{"title":"Picknick","date":"2026-08-01","badgeType":"green"}`)

	eventsNotified := subscribe(t, app.eventsBroker)
	acceptSuggestion(t, app, "lena", s.ID, http.StatusOK)

	if got := countEvents(t, app); got != before+1 {
		t.Fatalf("expected exactly one new event, got %d (was %d)", got, before)
	}
	if !eventsNotified() {
		t.Fatal("expected the events broker to be notified on accept")
	}

	// Re-accepting is a no-op: no second event, and it stays off the list.
	acceptSuggestion(t, app, "lena", s.ID, http.StatusOK)
	if got := countEvents(t, app); got != before+1 {
		t.Fatalf("re-accept created an extra event: now %d", got)
	}
	if got := listSuggestions(t, app, "lena"); containsSuggestion(got, s.ID) {
		t.Fatal("accepted suggestion should not appear in the pending list")
	}

	// The created event carries the suggester as `who`.
	var who string
	if err := app.pool.QueryRow(t.Context(),
		`SELECT who FROM events WHERE title='Picknick'`).Scan(&who); err != nil {
		t.Fatalf("lookup created event: %v", err)
	}
	if who != "max" {
		t.Fatalf("expected accepted event attributed to suggester 'max', got %q", who)
	}
}

func TestSuggestionDeclineCreatesNoEvent(t *testing.T) {
	app := newTestApp(t)

	before := countEvents(t, app)
	s := createSuggestion(t, app, "max", `{"title":"Absage","date":"2026-09-01"}`)
	declineSuggestion(t, app, "lena", s.ID, http.StatusOK)

	if got := countEvents(t, app); got != before {
		t.Fatalf("decline must not create an event: %d (was %d)", got, before)
	}
}

func acceptSuggestion(t *testing.T, app *App, user, id string, wantCode int) {
	t.Helper()
	req := authedRequest(http.MethodPost, "/api/event-suggestions/"+id+"/accept", "", user)
	req.SetPathValue("id", id)
	rr := httptest.NewRecorder()
	app.handleSuggestionAccept(rr, req)
	if rr.Code != wantCode {
		t.Fatalf("accept expected %d, got %d: %s", wantCode, rr.Code, rr.Body.String())
	}
}

func declineSuggestion(t *testing.T, app *App, user, id string, wantCode int) {
	t.Helper()
	req := authedRequest(http.MethodPost, "/api/event-suggestions/"+id+"/decline", "", user)
	req.SetPathValue("id", id)
	rr := httptest.NewRecorder()
	app.handleSuggestionDecline(rr, req)
	if rr.Code != wantCode {
		t.Fatalf("decline expected %d, got %d: %s", wantCode, rr.Code, rr.Body.String())
	}
}

func containsSuggestion(list []EventSuggestion, id string) bool {
	for _, s := range list {
		if s.ID == id {
			return true
		}
	}
	return false
}
