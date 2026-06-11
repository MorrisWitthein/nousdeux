package main

import "testing"

func TestCanonicalPlatform(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		// Supported services and their TMDB variants/rebrands.
		{"Netflix", "Netflix"},
		{"Netflix Standard with Ads", "Netflix"},
		{"Amazon Prime Video", "Prime"},
		{"Prime Video", "Prime"},
		{"Disney Plus", "Disney+"},
		{"Disney+", "Disney+"},
		{"HBO Max", "HBO"},
		{"Max", "HBO"},
		{"WOW", "WOW"},

		// Amazon Channels are sold via Prime but are separate services.
		{"Paramount+ Amazon Channel", ""},
		{"Crunchyroll Amazon Channel", ""},

		// Long-tail providers we deliberately drop.
		{"Apple TV Plus", ""},
		{"MUBI", ""},
		{"", ""},
	}

	for _, tt := range tests {
		if got := canonicalPlatform(tt.input); got != tt.want {
			t.Errorf("canonicalPlatform(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
