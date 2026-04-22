package main

import (
	"strings"
	"testing"
)

func intPtr(v int) *int { return &v }

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

func TestValidateSeries(t *testing.T) {
	long := strings.Repeat("a", 256)

	cases := []struct {
		name    string
		s       Series
		wantErr string
	}{
		{"valid minimal", Series{Title: "Breaking Bad"}, ""},
		{"valid full", Series{Title: "Breaking Bad", Progress: 50, StatusType: "green"}, ""},
		{"valid progress 0", Series{Title: "x", Progress: 0}, ""},
		{"valid progress 100", Series{Title: "x", Progress: 100}, ""},
		{"title too long", Series{Title: long}, "title exceeds"},
		{"progress negative", Series{Title: "x", Progress: -1}, "progress must be between 0 and 100"},
		{"progress over 100", Series{Title: "x", Progress: 101}, "progress must be between 0 and 100"},
		{"bad statusType", Series{Title: "x", StatusType: "blue"}, "statusType must be one of"},
		{"valid statusType yellow", Series{Title: "x", StatusType: "yellow"}, ""},
		{"valid statusType red", Series{Title: "x", StatusType: "red"}, ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateSeries(tc.s)
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

func TestValidateActivity(t *testing.T) {
	long := strings.Repeat("a", 256)

	cases := []struct {
		name    string
		a       Activity
		wantErr string
	}{
		{"valid minimal", Activity{Title: "Wandern"}, ""},
		{"valid full", Activity{Title: "Wandern", Date: "2026-04-22", Time: "09:00"}, ""},
		{"title too long", Activity{Title: long}, "title exceeds"},
		{"bad date format slash", Activity{Title: "x", Date: "22/04/2026"}, "date must be YYYY-MM-DD"},
		{"bad date format reversed", Activity{Title: "x", Date: "22-04-2026"}, "date must be YYYY-MM-DD"},
		{"bad time no colon", Activity{Title: "x", Time: "0900"}, "time must be HH:MM"},
		{"bad time single digit hour", Activity{Title: "x", Time: "9:00"}, "time must be HH:MM"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateActivity(tc.a)
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

func TestValidateRecipe(t *testing.T) {
	long := strings.Repeat("a", 256)

	cases := []struct {
		name    string
		r       Recipe
		wantErr string
	}{
		{"valid minimal", Recipe{Title: "Pasta"}, ""},
		{"valid full", Recipe{Title: "Pasta", Rating: 5, PrepTime: intPtr(30), Servings: intPtr(4)}, ""},
		{"valid rating zero", Recipe{Title: "x", Rating: 0}, ""},
		{"title too long", Recipe{Title: long}, "title exceeds"},
		{"rating too high", Recipe{Title: "x", Rating: 6}, "rating must be between 0 and 5"},
		{"rating negative", Recipe{Title: "x", Rating: -1}, "rating must be between 0 and 5"},
		{"prepTime negative", Recipe{Title: "x", PrepTime: intPtr(-1)}, "prepTime must be"},
		{"prepTime zero ok", Recipe{Title: "x", PrepTime: intPtr(0)}, ""},
		{"servings zero", Recipe{Title: "x", Servings: intPtr(0)}, "servings must be"},
		{"servings negative", Recipe{Title: "x", Servings: intPtr(-1)}, "servings must be"},
		{"servings one ok", Recipe{Title: "x", Servings: intPtr(1)}, ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateRecipe(tc.r)
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
