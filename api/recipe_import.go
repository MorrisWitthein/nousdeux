package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"golang.org/x/net/html"
)

type importReq struct {
	URL         string `json:"url"`
	ImageBase64 string `json:"imageBase64"`
}

type importedRecipe struct {
	Title       string   `json:"title"`
	Emoji       string   `json:"emoji"`
	Tags        []string `json:"tags"`
	Ingredients string   `json:"ingredients"`
	Steps       string   `json:"steps"`
	PrepTime    int      `json:"prepTime"`
	Servings    int      `json:"servings"`
}

func handleRecipeImport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		writeError(w, http.StatusServiceUnavailable, "ANTHROPIC_API_KEY not configured")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 20<<20)
	var req importReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}

	ctx := r.Context()
	var recipe importedRecipe
	var err error

	switch {
	case req.URL != "":
		if u, parseErr := url.Parse(req.URL); parseErr != nil || (u.Scheme != "http" && u.Scheme != "https") {
			writeError(w, http.StatusBadRequest, "url must be a valid http or https URL")
			return
		}
		recipe, err = importFromURL(ctx, req.URL, apiKey)
	case req.ImageBase64 != "":
		recipe, err = importFromImage(ctx, req.ImageBase64, apiKey)
	default:
		writeError(w, http.StatusBadRequest, "url or imageBase64 is required")
		return
	}

	if err != nil {
		slog.Error("recipe import failed", "err", err)
		writeError(w, http.StatusBadGateway, "import failed: "+err.Error())
		return
	}

	slog.Info("recipe imported", "title", recipe.Title)
	writeJSON(w, http.StatusOK, recipe)
}

func importFromURL(ctx context.Context, rawURL, apiKey string) (importedRecipe, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return importedRecipe{}, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; nousdeux/1.0)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	client := &http.Client{Timeout: 15 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return importedRecipe{}, fmt.Errorf("fetch page: %w", err)
	}
	defer res.Body.Close()

	text, err := htmlToText(res.Body)
	if err != nil {
		return importedRecipe{}, fmt.Errorf("parse HTML: %w", err)
	}
	if len(text) > 12000 {
		text = text[:12000]
	}

	return callClaude(ctx, apiKey, buildTextMessage(text))
}

func importFromImage(ctx context.Context, imageBase64, apiKey string) (importedRecipe, error) {
	return callClaude(ctx, apiKey, buildImageMessage(imageBase64))
}

// skip is the set of HTML elements whose subtrees are noise (not recipe content).
var htmlSkipTags = map[string]bool{
	"script": true, "style": true, "head": true,
	"nav": true, "footer": true, "aside": true,
	"iframe": true, "noscript": true,
}

func htmlToText(r io.Reader) (string, error) {
	doc, err := html.Parse(r)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode && htmlSkipTags[n.Data] {
			return
		}
		if n.Type == html.TextNode {
			if t := strings.TrimSpace(n.Data); t != "" {
				buf.WriteString(t)
				buf.WriteByte('\n')
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(doc)
	return buf.String(), nil
}

func stripMarkdownFences(s string) string {
	if idx := strings.Index(s, "```"); idx != -1 {
		s = s[idx:]
		// skip the opening fence line (e.g. "```json\n")
		if nl := strings.Index(s, "\n"); nl != -1 {
			s = s[nl+1:]
		}
		// trim closing fence
		if end := strings.LastIndex(s, "```"); end != -1 {
			s = s[:end]
		}
	}
	return strings.TrimSpace(s)
}

const extractPrompt = `Extract the recipe from the content below and return a JSON object with these fields:
- title (string, just the dish name — no possessives, origin stories, or adjectives like "Grandma's", "Original", "Best ever"; e.g. "Spaghetti Carbonara" not "Grandma's Original Spaghetti Carbonara")
- emoji (single emoji that fits the dish)
- tags (array of strings, max 4, lowercase)
- ingredients (newline-separated list, amounts first, e.g. "200g Mehl")
- steps (newline-separated steps)
- don't numerate the steps, as that will be handled automatically
- prepTime (integer, total minutes including cooking)
- servings (integer)

Translate all text to German. Return only valid JSON, no markdown fences. If the provided content doesn't include a recipe or you are missing information, do NOT fill in the gaps yourself. Never include any information that is not part of the original recipe. If there is anything missing just say soF.`

type claudeContent struct {
	Type   string       `json:"type"`
	Text   string       `json:"text,omitempty"`
	Source *imageSource `json:"source,omitempty"`
}

type imageSource struct {
	Type      string `json:"type"`
	MediaType string `json:"media_type"`
	Data      string `json:"data"`
}

type claudeMsg struct {
	Role    string          `json:"role"`
	Content []claudeContent `json:"content"`
}

type claudeAPIReq struct {
	Model     string      `json:"model"`
	MaxTokens int         `json:"max_tokens"`
	Messages  []claudeMsg `json:"messages"`
}

func buildTextMessage(text string) claudeMsg {
	return claudeMsg{
		Role: "user",
		Content: []claudeContent{
			{Type: "text", Text: extractPrompt + "\n\n" + text},
		},
	}
}

func buildImageMessage(imageBase64 string) claudeMsg {
	mediaType := "image/jpeg"
	data := imageBase64
	if before, after, ok := strings.Cut(imageBase64, ";base64,"); ok {
		mediaType = strings.TrimPrefix(before, "data:")
		data = after
	}
	return claudeMsg{
		Role: "user",
		Content: []claudeContent{
			{
				Type: "image",
				Source: &imageSource{
					Type:      "base64",
					MediaType: mediaType,
					Data:      data,
				},
			},
			{Type: "text", Text: extractPrompt},
		},
	}
}

func callClaude(ctx context.Context, apiKey string, msg claudeMsg) (importedRecipe, error) {
	payload := claudeAPIReq{
		Model:     "claude-haiku-4-5-20251001",
		MaxTokens: 1024,
		Messages:  []claudeMsg{msg},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return importedRecipe{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	if err != nil {
		return importedRecipe{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 60 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return importedRecipe{}, fmt.Errorf("claude request: %w", err)
	}
	defer res.Body.Close()

	var resp struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(res.Body).Decode(&resp); err != nil {
		return importedRecipe{}, fmt.Errorf("decode claude response: %w", err)
	}
	if resp.Error != nil {
		return importedRecipe{}, fmt.Errorf("claude API: %s", resp.Error.Message)
	}
	if len(resp.Content) == 0 || resp.Content[0].Text == "" {
		return importedRecipe{}, fmt.Errorf("claude returned empty response")
	}

	text := stripMarkdownFences(strings.TrimSpace(resp.Content[0].Text))
	var recipe importedRecipe
	if err := json.Unmarshal([]byte(text), &recipe); err != nil {
		return importedRecipe{}, fmt.Errorf("parse claude JSON: %w (got: %q)", err, text)
	}
	return recipe, nil
}
