package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"os"

	"github.com/mwitthein/nousdeux-api/sse"
)

// handleListImage proxies poster search to TMDB (GET) and stores the result
// (PATCH) for a movies/series row. It mirrors handleRecipeImage but targets
// TMDB instead of Unsplash, parameterized by table ("movies"/"series"),
// TMDB media type ("movie"/"tv"), and the broker to notify on store.
func handleListImage(table, mediaType string, broker *sse.Broker) http.HandlerFunc {
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
				"&query=" + url.QueryEscape(q) + "&page=1&include_adult=false"
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
					PosterPath string `json:"poster_path"`
				} `json:"results"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
				slog.Warn("tmdb decode failed", "query", q, "err", err)
				writeError(w, http.StatusBadGateway, "decode: "+err.Error())
				return
			}
			poster := ""
			for _, res := range result.Results {
				if res.PosterPath != "" {
					poster = res.PosterPath
					break
				}
			}
			if poster == "" {
				slog.Warn("tmdb no poster", "query", q, "type", mediaType)
				writeError(w, http.StatusNotFound, "no poster found")
				return
			}
			writeJSON(w, http.StatusOK, map[string]string{"url": "https://image.tmdb.org/t/p/w342" + poster})

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
			tag, err := pool.Exec(ctx, `UPDATE `+table+` SET image_url=$1 WHERE id=$2`, nullIfEmpty(body.URL), id)
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
