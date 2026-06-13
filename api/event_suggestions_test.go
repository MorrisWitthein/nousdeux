package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// suggestionLists mirrors the GET /api/event-suggestions response.
type suggestionLists struct {
	Received []EventSuggestion `json:"received"`
	Sent     []EventSuggestion `json:"sent"`
}

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

// listSuggestions returns the received/sent lists visible to user.
func listSuggestions(t *testing.T, app *App, user string) suggestionLists {
	t.Helper()
	req := authedRequest(http.MethodGet, "/api/event-suggestions", "", user)
	rr := httptest.NewRecorder()
	app.handleEventSuggestions(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("list expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var out suggestionLists
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
	if s.Awaiting != "recipient" {
		t.Fatalf("expected awaiting 'recipient', got %q", s.Awaiting)
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

func TestSuggestionReceivedVsSentSplit(t *testing.T) {
	app := newTestApp(t)

	s := createSuggestion(t, app, "max", `{"title":"Kino","date":"2026-07-04"}`)

	// The recipient sees it under received, not sent.
	lena := listSuggestions(t, app, "lena")
	if !containsSuggestion(lena.Received, s.ID) {
		t.Fatal("expected lena to see max's suggestion under received")
	}
	if containsSuggestion(lena.Sent, s.ID) {
		t.Fatal("lena did not send this; it must not be under sent")
	}

	// The sender sees it under sent (tracking), never under received.
	max := listSuggestions(t, app, "max")
	if containsSuggestion(max.Received, s.ID) {
		t.Fatal("a user must not be notified of their own suggestion")
	}
	if !containsSuggestion(max.Sent, s.ID) {
		t.Fatal("expected max to track their own suggestion under sent")
	}

	// Once resolved it leaves received but stays in the sender's sent history.
	declineSuggestion(t, app, "lena", s.ID, http.StatusOK)
	if containsSuggestion(listSuggestions(t, app, "lena").Received, s.ID) {
		t.Fatal("a declined suggestion should leave received")
	}
	if got := findSuggestion(listSuggestions(t, app, "max").Sent, s.ID); got == nil || got.Status != "declined" {
		t.Fatalf("expected max's sent thread to show status declined, got %+v", got)
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
	if containsSuggestion(listSuggestions(t, app, "lena").Received, s.ID) {
		t.Fatal("accepted suggestion should not appear under received")
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

func TestSuggestionCounterBouncesBackAndAccepts(t *testing.T) {
	app := newTestApp(t)

	before := countEvents(t, app)
	s := createSuggestion(t, app, "max", `{"title":"Kino","date":"2026-10-01","time":"19:00","badgeType":"green"}`)

	// Lena counters with a different date/time. It leaves her received queue and
	// bounces back to max, who now sees it under received as a counter-proposal.
	counterSuggestion(t, app, "lena", s.ID, `{"date":"2026-10-02","time":"20:00"}`, http.StatusOK)
	if containsSuggestion(listSuggestions(t, app, "lena").Received, s.ID) {
		t.Fatal("after countering, it should leave lena's received queue")
	}
	maxRecv := findSuggestion(listSuggestions(t, app, "max").Received, s.ID)
	if maxRecv == nil {
		t.Fatal("expected the counter to bounce back to max's received queue")
	}
	if maxRecv.Date != "2026-10-02" || maxRecv.Time != "20:00" {
		t.Fatalf("expected countered date/time, got %s %s", maxRecv.Date, maxRecv.Time)
	}
	if maxRecv.LastProposedBy != "lena" {
		t.Fatalf("expected lastProposedBy 'lena', got %q", maxRecv.LastProposedBy)
	}

	// Max accepts the counter: exactly one event with the countered values.
	acceptSuggestion(t, app, "max", s.ID, http.StatusOK)
	if got := countEvents(t, app); got != before+1 {
		t.Fatalf("expected one event after accepting the counter, got %d", got)
	}
	var date, tm string
	if err := app.pool.QueryRow(t.Context(),
		`SELECT COALESCE(date,''), COALESCE(time,'') FROM events WHERE title='Kino'`).Scan(&date, &tm); err != nil {
		t.Fatalf("lookup event: %v", err)
	}
	if date != "2026-10-02" || tm != "20:00" {
		t.Fatalf("event should carry the countered date/time, got %s %s", date, tm)
	}
}

func TestSuggestionCounterRejectsWrongTurn(t *testing.T) {
	app := newTestApp(t)

	// max created it, so it is awaiting lena; max cannot counter on lena's turn.
	s := createSuggestion(t, app, "max", `{"title":"Kino","date":"2026-11-01"}`)
	counterSuggestion(t, app, "max", s.ID, `{"date":"2026-11-02"}`, http.StatusConflict)
}

func acceptSuggestion(t *testing.T, app *App, user, id string, wantCode int) {
	t.Helper()
	postSuggestionAction(t, app.handleSuggestionAccept, user, id, "", wantCode, "accept")
}

func declineSuggestion(t *testing.T, app *App, user, id string, wantCode int) {
	t.Helper()
	postSuggestionAction(t, app.handleSuggestionDecline, user, id, "", wantCode, "decline")
}

func counterSuggestion(t *testing.T, app *App, user, id, body string, wantCode int) {
	t.Helper()
	postSuggestionAction(t, app.handleSuggestionCounter, user, id, body, wantCode, "counter")
}

func postSuggestionAction(t *testing.T, h http.HandlerFunc, user, id, body string, wantCode int, name string) {
	t.Helper()
	req := authedRequest(http.MethodPost, "/api/event-suggestions/"+id+"/"+name, body, user)
	req.SetPathValue("id", id)
	rr := httptest.NewRecorder()
	h(rr, req)
	if rr.Code != wantCode {
		t.Fatalf("%s expected %d, got %d: %s", name, wantCode, rr.Code, rr.Body.String())
	}
}

func findSuggestion(list []EventSuggestion, id string) *EventSuggestion {
	for i := range list {
		if list[i].ID == id {
			return &list[i]
		}
	}
	return nil
}

func containsSuggestion(list []EventSuggestion, id string) bool {
	return findSuggestion(list, id) != nil
}
