package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func postEvents(body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/events", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	handleEvents(rr, req)
	return rr
}

func patchEvents(id, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPatch, "/api/events?id="+id, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	handleEvents(rr, req)
	return rr
}

func assertBadRequest(t *testing.T, rr *httptest.ResponseRecorder, contains string) {
	t.Helper()
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !strings.Contains(resp["error"], contains) {
		t.Fatalf("error %q does not contain %q", resp["error"], contains)
	}
}

func TestHandleEventsPostValidation(t *testing.T) {
	long := `"` + strings.Repeat("a", 256) + `"`

	cases := []struct {
		name    string
		body    string
		wantMsg string
	}{
		{
			"title too long",
			`{"title":` + long + `}`,
			"title exceeds",
		},
		{
			"bad date format",
			`{"title":"x","date":"22-04-2026"}`,
			"date must be YYYY-MM-DD",
		},
		{
			"bad endDate format",
			`{"title":"x","endDate":"not-a-date"}`,
			"endDate must be YYYY-MM-DD",
		},
		{
			"endDate not after date",
			`{"title":"x","date":"2026-04-22","endDate":"2026-04-22"}`,
			"endDate must be strictly after date",
		},
		{
			"bad time format",
			`{"title":"x","time":"1800"}`,
			"time must be HH:MM",
		},
		{
			"bad badgeType",
			`{"title":"x","badgeType":"blue"}`,
			"badgeType must be one of",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assertBadRequest(t, postEvents(tc.body), tc.wantMsg)
		})
	}
}

func TestHandleEventsPatchValidation(t *testing.T) {
	cases := []struct {
		name    string
		body    string
		wantMsg string
	}{
		{
			"bad date format",
			`{"title":"x","date":"22/04/2026"}`,
			"date must be YYYY-MM-DD",
		},
		{
			"endDate before date",
			`{"title":"x","date":"2026-04-22","endDate":"2026-04-21"}`,
			"endDate must be strictly after date",
		},
		{
			"bad time format",
			`{"title":"x","time":"9:00"}`,
			"time must be HH:MM",
		},
		{
			"bad badgeType",
			`{"title":"x","badgeType":"orange"}`,
			"badgeType must be one of",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assertBadRequest(t, patchEvents("some-id", tc.body), tc.wantMsg)
		})
	}
}
