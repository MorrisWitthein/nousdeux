package main

import "testing"

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"normal.pdf", "normal.pdf"},
		{"ticket 2026.pdf", "ticket 2026.pdf"},
		{"../../../etc/passwd", "passwd"},
		{"../../secret.txt", "secret.txt"},
		{"/absolute/path/file.jpg", "file.jpg"},
		{"..", ".."},
		{"", "."},
	}

	for _, tt := range tests {
		got := sanitizeFilename(tt.input)
		if got != tt.want {
			t.Errorf("sanitizeFilename(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
