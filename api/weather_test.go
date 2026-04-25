package main

import "testing"

func TestWmoToEmoji(t *testing.T) {
	cases := []struct {
		name  string
		code  int
		isDay bool
		want  string
	}{
		// Clear sky — isDay determines sun vs moon
		{"clear day", 0, true, "☀️"},
		{"clear night", 0, false, "🌙"},

		// Mainly/partly cloudy (1–2)
		{"mainly clear", 1, true, "🌤️"},
		{"partly cloudy", 2, true, "🌤️"},

		// Overcast (3 only)
		{"overcast", 3, true, "☁️"},

		// Fog (4–48) — boundary values
		{"fog low", 4, true, "🌫️"},
		{"fog high", 48, true, "🌫️"},

		// Drizzle (49–55)
		{"drizzle low", 49, true, "🌦️"},
		{"drizzle high", 55, true, "🌦️"},

		// Rain (56–67)
		{"rain low", 56, true, "🌧️"},
		{"rain high", 67, true, "🌧️"},

		// Snow (68–77)
		{"snow low", 68, true, "❄️"},
		{"snow high", 77, true, "❄️"},

		// Rain showers (78–82)
		{"showers low", 78, true, "🌧️"},
		{"showers high", 82, true, "🌧️"},

		// Snow showers (83–86)
		{"snow showers low", 83, true, "🌨️"},
		{"snow showers high", 86, true, "🌨️"},

		// Thunderstorm (87+)
		{"thunderstorm", 95, true, "⛈️"},
		{"thunderstorm hail", 99, true, "⛈️"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := wmoToEmoji(tc.code, tc.isDay)
			if got != tc.want {
				t.Errorf("wmoToEmoji(%d, %v) = %q, want %q", tc.code, tc.isDay, got, tc.want)
			}
		})
	}
}
