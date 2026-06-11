package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// authedRequest builds a request whose context carries an authenticated user,
// as requireAuth would have populated it, so handlers see who is acting.
func authedRequest(method, target, body, user string) *http.Request {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), userKey, user)
	return req.WithContext(ctx)
}

func TestEventsCRUDRoundTrip(t *testing.T) {
	app := newTestApp(t)

	// GET on an empty (freshly migrated) schema returns 200 + JSON array.
	getReq := authedRequest(http.MethodGet, "/api/events", "", "max")
	getRR := httptest.NewRecorder()
	app.handleEvents(getRR, getReq)
	if getRR.Code != http.StatusOK {
		t.Fatalf("GET expected 200, got %d: %s", getRR.Code, getRR.Body.String())
	}
	var list []Event
	if err := decodeJSON(getRR, &list); err != nil {
		t.Fatalf("GET decode: %v", err)
	}

	// POST creates a row: 201 + generated id/created_at + who from context,
	// and the events broker is notified.
	notified := subscribe(t, app.eventsBroker)
	postReq := authedRequest(http.MethodPost, "/api/events",
		`{"title":"Dinner","date":"2026-07-01","badgeType":"green"}`, "max")
	postRR := httptest.NewRecorder()
	app.handleEvents(postRR, postReq)
	if postRR.Code != http.StatusCreated {
		t.Fatalf("POST expected 201, got %d: %s", postRR.Code, postRR.Body.String())
	}
	var created Event
	if err := decodeJSON(postRR, &created); err != nil {
		t.Fatalf("POST decode: %v", err)
	}
	if created.ID == "" {
		t.Fatal("POST: expected a generated id")
	}
	if created.CreatedAt.IsZero() {
		t.Fatal("POST: expected a created_at timestamp")
	}
	if created.Who != "max" {
		t.Fatalf("POST: expected who 'max', got %q", created.Who)
	}
	if !notified() {
		t.Fatal("POST: expected the events broker to be notified")
	}

	// PATCH updates the row and returns success.
	patchReq := authedRequest(http.MethodPatch, "/api/events?id="+created.ID,
		`{"title":"Late Dinner","date":"2026-07-01"}`, "max")
	patchRR := httptest.NewRecorder()
	app.handleEvents(patchRR, patchReq)
	if patchRR.Code != http.StatusOK {
		t.Fatalf("PATCH expected 200, got %d: %s", patchRR.Code, patchRR.Body.String())
	}

	// DELETE removes the row.
	delReq := authedRequest(http.MethodDelete, "/api/events?id="+created.ID, "", "max")
	delRR := httptest.NewRecorder()
	app.handleEvents(delRR, delReq)
	if delRR.Code != http.StatusOK {
		t.Fatalf("DELETE expected 200, got %d: %s", delRR.Code, delRR.Body.String())
	}
}

func TestEventsMissingIDNotFound(t *testing.T) {
	app := newTestApp(t)

	// A syntactically valid UUID that matches no row.
	const missing = "00000000-0000-0000-0000-000000000000"

	patchReq := authedRequest(http.MethodPatch, "/api/events?id="+missing,
		`{"title":"x","date":"2026-07-01"}`, "max")
	patchRR := httptest.NewRecorder()
	app.handleEvents(patchRR, patchReq)
	if patchRR.Code != http.StatusNotFound {
		t.Fatalf("PATCH missing expected 404, got %d: %s", patchRR.Code, patchRR.Body.String())
	}

	delReq := authedRequest(http.MethodDelete, "/api/events?id="+missing, "", "max")
	delRR := httptest.NewRecorder()
	app.handleEvents(delRR, delReq)
	if delRR.Code != http.StatusNotFound {
		t.Fatalf("DELETE missing expected 404, got %d: %s", delRR.Code, delRR.Body.String())
	}
}
