package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/mwitthein/nousdeux-api/sse"
)

// handleListImage proxies poster search to TMDB (GET) and stores the result
// (PATCH) for a movies/series row. It mirrors handleRecipeImage but targets
// TMDB instead of Unsplash, parameterized by table ("movies"/"series"),
// TMDB media type ("movie"/"tv"), and the broker to notify on store.
func (app *App) handleListImage(table, mediaType string, broker *sse.Broker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		switch r.Method {
		case http.MethodGet:
			q := r.URL.Query().Get("q")
			if q == "" {
				writeError(w, http.StatusBadRequest, "q is required")
				return
			}
			key := os.Getenv("TMDB_API_KEY")
			if key == "" {
				writeError(w, http.StatusServiceUnavailable, "image search not configured")
				return
			}
			apiURL := "https://api.tmdb.org/3/search/" + mediaType +
				"?api_key=" + url.QueryEscape(key) +
				"&query=" + url.QueryEscape(q) + "&language=de-DE&page=1&include_adult=false"
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "build request: "+err.Error())
				return
			}
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				slog.Error("tmdb fetch failed", "query", q, "type", mediaType, "err", err)
				writeError(w, http.StatusBadGateway, "upstream: "+err.Error())
				return
			}
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				slog.Error("tmdb returned error", "query", q, "type", mediaType, "status", resp.StatusCode)
				writeError(w, http.StatusBadGateway, "upstream status: "+resp.Status)
				return
			}
			var result struct {
				Results []struct {
					ID         int    `json:"id"`
					PosterPath string `json:"poster_path"`
				} `json:"results"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
				slog.Warn("tmdb decode failed", "query", q, "err", err)
				writeError(w, http.StatusBadGateway, "decode: "+err.Error())
				return
			}
			poster := ""
			tmdbID := 0
			for _, res := range result.Results {
				if res.PosterPath != "" {
					poster = res.PosterPath
					tmdbID = res.ID
					break
				}
			}
			if poster == "" {
				slog.Warn("tmdb no poster", "query", q, "type", mediaType)
				writeError(w, http.StatusNotFound, "no poster found")
				return
			}
			// Best-effort: enrich with genres + DE streaming platforms from the
			// detail endpoint. Failures here must not block the poster response.
			genres, platform := fetchTMDBDetail(ctx, key, mediaType, tmdbID)
			writeJSON(w, http.StatusOK, map[string]any{
				"url":      "https://image.tmdb.org/t/p/w342" + poster,
				"genres":   genres,
				"platform": platform,
			})

		case http.MethodPatch:
			id := r.URL.Query().Get("id")
			if id == "" {
				writeError(w, http.StatusBadRequest, "id is required")
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, 32*1024)
			var body struct {
				URL string `json:"url"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
				return
			}
			tag, err := app.pool.Exec(ctx, `UPDATE `+table+` SET image_url=$1 WHERE id=$2`, nullIfEmpty(body.URL), id)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "update: "+err.Error())
				return
			}
			if tag.RowsAffected() == 0 {
				writeError(w, http.StatusNotFound, "not found")
				return
			}
			slog.Info("list image set", "table", table, "id", id)
			broker.Notify()
			writeJSON(w, http.StatusOK, map[string]string{"updated": id})

		default:
			w.Header().Set("Allow", "GET, PATCH, OPTIONS")
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
	}
}

// canonicalPlatform maps a TMDB provider name to one of the major streaming
// services we support, or "" if it is not one of them. This deliberately
// excludes Amazon Channels (e.g. "Paramount+ Amazon Channel") and other
// long-tail providers, collapsing rebrands/variants onto a single label.
func canonicalPlatform(name string) string {
	n := strings.ToLower(name)
	// Amazon Channels are sold through Prime but are separate services; never
	// surface them, even though their names may contain other brand keywords.
	if strings.Contains(n, "channel") {
		return ""
	}
	switch {
	case strings.Contains(n, "netflix"):
		return "Netflix"
	case strings.Contains(n, "amazon prime video"), n == "prime video":
		return "Prime"
	case strings.Contains(n, "disney"):
		return "Disney+"
	case strings.Contains(n, "hbo"), n == "max":
		return "HBO"
	case strings.Contains(n, "wow"):
		return "WOW"
	}
	return ""
}

// fetchTMDBDetail pulls genres (German) and the single best DE flatrate
// streaming provider for a TMDB title. It is best-effort: any error returns
// empty values so the caller can still serve the poster. genres are returned as
// []string (always non-nil so JSON encodes [] rather than null); platform is a
// single supported service name (see canonicalPlatform) or "".
func fetchTMDBDetail(ctx context.Context, key, mediaType string, id int) ([]string, string) {
	genres := []string{}
	if id == 0 {
		return genres, ""
	}
	apiURL := "https://api.tmdb.org/3/" + mediaType + "/" + strconv.Itoa(id) +
		"?api_key=" + url.QueryEscape(key) +
		"&language=de-DE&append_to_response=watch/providers"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return genres, ""
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Warn("tmdb detail fetch failed", "id", id, "type", mediaType, "err", err)
		return genres, ""
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		slog.Warn("tmdb detail returned error", "id", id, "type", mediaType, "status", resp.StatusCode)
		return genres, ""
	}
	var detail struct {
		Genres []struct {
			Name string `json:"name"`
		} `json:"genres"`
		WatchProviders struct {
			Results map[string]struct {
				Flatrate []struct {
					ProviderName string `json:"provider_name"`
				} `json:"flatrate"`
			} `json:"results"`
		} `json:"watch/providers"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&detail); err != nil {
		slog.Warn("tmdb detail decode failed", "id", id, "err", err)
		return genres, ""
	}
	for _, g := range detail.Genres {
		if g.Name != "" {
			genres = append(genres, g.Name)
		}
	}
	// Pick the first flatrate provider that maps to a supported service. TMDB
	// orders providers by display priority, so the first match is the most
	// relevant one.
	platform := ""
	for _, p := range detail.WatchProviders.Results["DE"].Flatrate {
		if c := canonicalPlatform(p.ProviderName); c != "" {
			platform = c
			break
		}
	}
	return genres, platform
}
