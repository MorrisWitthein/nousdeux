package main

import (
	"strings"
	"testing"
)

func TestValidateEvent(t *testing.T) {
	long := strings.Repeat("a", 256)

	cases := []struct {
		name    string
		e       Event
		wantErr string
	}{
		{"valid minimal", Event{Title: "Party"}, ""},
		{"valid full", Event{Title: "Party", Date: "2026-04-22", EndDate: "2026-04-23", Time: "18:00", BadgeType: "green"}, ""},
		{"valid badgeType red", Event{Title: "x", BadgeType: "red"}, ""},
		{"valid badgeType yellow", Event{Title: "x", BadgeType: "yellow"}, ""},
		{"title too long", Event{Title: long}, "title exceeds"},
		{"bad date format slash", Event{Title: "x", Date: "22/04/2026"}, "date must be YYYY-MM-DD"},
		{"bad date format reversed", Event{Title: "x", Date: "22-04-2026"}, "date must be YYYY-MM-DD"},
		{"bad endDate format", Event{Title: "x", EndDate: "not-a-date"}, "endDate must be YYYY-MM-DD"},
		{"endDate same as date", Event{Title: "x", Date: "2026-04-22", EndDate: "2026-04-22"}, "endDate must be strictly after date"},
		{"endDate before date", Event{Title: "x", Date: "2026-04-22", EndDate: "2026-04-21"}, "endDate must be strictly after date"},
		{"bad time no colon", Event{Title: "x", Time: "1800"}, "time must be HH:MM"},
		{"bad time single digit hour", Event{Title: "x", Time: "6:00"}, "time must be HH:MM"},
		{"bad badgeType", Event{Title: "x", BadgeType: "blue"}, "badgeType must be one of"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateEvent(tc.e)
			if tc.wantErr == "" {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
			} else {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				if !strings.Contains(err.Error(), tc.wantErr) {
					t.Fatalf("error %q does not contain %q", err.Error(), tc.wantErr)
				}
			}
		})
	}
}
