package main

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestImportedRecipeFlexInt(t *testing.T) {
	cases := []struct {
		name         string
		json         string
		wantPrep     flexInt
		wantServings flexInt
	}{
		{"clean integers", `{"prepTime":45,"servings":4}`, 45, 4},
		{"soF placeholder", `{"prepTime":"soF","servings":"soF"}`, 0, 0},
		{"quoted numbers", `{"prepTime":"30","servings":"2"}`, 30, 2},
		{"number with unit", `{"prepTime":"30 min","servings":"4 Portionen"}`, 30, 4},
		{"float value", `{"prepTime":45.0,"servings":4.0}`, 45, 4},
		{"null value", `{"prepTime":null,"servings":null}`, 0, 0},
		{"missing fields", `{"title":"Pasta"}`, 0, 0},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var r importedRecipe
			if err := json.Unmarshal([]byte(tc.json), &r); err != nil {
				t.Fatalf("unmarshal %q: %v", tc.json, err)
			}
			if r.PrepTime != tc.wantPrep {
				t.Errorf("PrepTime = %d, want %d", r.PrepTime, tc.wantPrep)
			}
			if r.Servings != tc.wantServings {
				t.Errorf("Servings = %d, want %d", r.Servings, tc.wantServings)
			}
		})
	}
}

func TestHtmlToText(t *testing.T) {
	cases := []struct {
		name    string
		html    string
		present []string // lines/substrings that MUST appear in the output
		absent  []string // substrings that must NOT appear
	}{
		{
			name:    "content kept, noise tags skipped",
			html:    `<html><head><title>Head Title</title></head><body><nav>NavLink</nav><h1>Recipe</h1><p>Mix flour and water.</p><script>var x = 1;</script><style>.a{color:red}</style><footer>FooterText</footer><aside>AsideText</aside><iframe>FrameText</iframe><noscript>NoScriptText</noscript></body></html>`,
			present: []string{"Recipe", "Mix flour and water."},
			absent:  []string{"Head Title", "NavLink", "var x = 1", "color:red", "FooterText", "AsideText", "FrameText", "NoScriptText"},
		},
		{
			name:    "empty input yields empty string",
			html:    "",
			present: nil,
			absent:  nil,
		},
		{
			name:    "whitespace-only text nodes yield empty string",
			html:    "<html><body><p>   </p><span>\n\t</span></body></html>",
			present: nil,
			absent:  nil,
		},
		{
			name:    "multiple text nodes each on their own line, trimmed",
			html:    "<html><body><p>  Line one  </p><p>Line two</p></body></html>",
			present: []string{"Line one\n", "Line two\n"},
			absent:  []string{"  Line one", "Line one  "},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := htmlToText(strings.NewReader(tc.html))
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tc.present == nil && tc.absent == nil {
				if strings.TrimSpace(got) != "" {
					t.Fatalf("expected empty output, got %q", got)
				}
				return
			}
			for _, want := range tc.present {
				if !strings.Contains(got, want) {
					t.Errorf("output %q missing expected %q", got, want)
				}
			}
			for _, notWant := range tc.absent {
				if strings.Contains(got, notWant) {
					t.Errorf("output %q unexpectedly contains %q", got, notWant)
				}
			}
		})
	}
}

func TestStripMarkdownFences(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "fenced with json language hint",
			in:   "```json\n{\"title\":\"Pasta\"}\n```",
			want: `{"title":"Pasta"}`,
		},
		{
			name: "bare fences",
			in:   "```\n{\"title\":\"Pasta\"}\n```",
			want: `{"title":"Pasta"}`,
		},
		{
			name: "surrounding prose stripped",
			in:   "Here is your recipe:\n```json\n{\"title\":\"Pasta\"}\n```\nEnjoy!",
			want: `{"title":"Pasta"}`,
		},
		{
			name: "trailing whitespace trimmed",
			in:   "```json\n{\"title\":\"Pasta\"}\n```   \n\n",
			want: `{"title":"Pasta"}`,
		},
		{
			name: "no fence returns trimmed input unchanged",
			in:   "  {\"title\":\"Pasta\"}  ",
			want: `{"title":"Pasta"}`,
		},
		{
			name: "no fence multiline preserved, only outer whitespace trimmed",
			in:   "\n{\n  \"title\": \"Pasta\"\n}\n",
			want: "{\n  \"title\": \"Pasta\"\n}",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := stripMarkdownFences(tc.in); got != tc.want {
				t.Errorf("stripMarkdownFences(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
	}
}
