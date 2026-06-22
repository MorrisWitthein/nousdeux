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
			key := os.Getenv("TMDB_API_KEY")
			if key == "" {
				writeError(w, http.StatusServiceUnavailable, "image search not configured")
				return
			}
			// Detail lookup for one specific TMDB title (selected from the search
			// results): returns genres + DE platform so the picker can fill the
			// form. Takes precedence over the search branch when present.
			if raw := r.URL.Query().Get("tmdbId"); raw != "" {
				tmdbID, err := strconv.Atoi(raw)
				if err != nil {
					writeError(w, http.StatusBadRequest, "tmdbId must be a number")
					return
				}
				genres, platform, totalSeasons := fetchTMDBDetail(ctx, key, mediaType, tmdbID)
				writeJSON(w, http.StatusOK, map[string]any{
					"genres":       genres,
					"platform":     platform,
					"totalSeasons": totalSeasons,
				})
				return
			}
			// Search: return all candidate titles so the user can disambiguate
			// instead of blindly taking the first hit.
			q := r.URL.Query().Get("q")
			if q == "" {
				writeError(w, http.StatusBadRequest, "q or tmdbId is required")
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
					ID           int    `json:"id"`
					PosterPath   string `json:"poster_path"`
					Title        string `json:"title"`          // movies
					Name         string `json:"name"`           // series
					ReleaseDate  string `json:"release_date"`   // movies
					FirstAirDate string `json:"first_air_date"` // series
				} `json:"results"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
				slog.Warn("tmdb decode failed", "query", q, "err", err)
				writeError(w, http.StatusBadGateway, "decode: "+err.Error())
				return
			}
			// Cap the list so the picker stays scannable; TMDB orders by relevance.
			const maxResults = 8
			candidates := make([]map[string]any, 0, maxResults)
			for _, res := range result.Results {
				title := res.Title
				if title == "" {
					title = res.Name
				}
				if title == "" {
					continue
				}
				date := res.ReleaseDate
				if date == "" {
					date = res.FirstAirDate
				}
				year := ""
				if len(date) >= 4 {
					year = date[:4]
				}
				posterURL := ""
				if res.PosterPath != "" {
					posterURL = "https://image.tmdb.org/t/p/w342" + res.PosterPath
				}
				candidates = append(candidates, map[string]any{
					"tmdbId":    res.ID,
					"title":     title,
					"year":      year,
					"posterUrl": posterURL,
				})
				if len(candidates) >= maxResults {
					break
				}
			}
			writeJSON(w, http.StatusOK, map[string]any{"results": candidates})

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

// fetchTMDBDetail pulls genres (German), the single best DE flatrate streaming
// provider, and (for series) the total number of seasons for a TMDB title. It
// is best-effort: any error returns zero values so the caller can still serve
// the poster. genres are returned as []string (always non-nil so JSON encodes
// [] rather than null); platform is a single supported service name (see
// canonicalPlatform) or ""; totalSeasons is 0 for movies or when unknown.
func fetchTMDBDetail(ctx context.Context, key, mediaType string, id int) ([]string, string, int) {
	genres := []string{}
	if id == 0 {
		return genres, "", 0
	}
	apiURL := "https://api.tmdb.org/3/" + mediaType + "/" + strconv.Itoa(id) +
		"?api_key=" + url.QueryEscape(key) +
		"&language=de-DE&append_to_response=watch/providers"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return genres, "", 0
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Warn("tmdb detail fetch failed", "id", id, "type", mediaType, "err", err)
		return genres, "", 0
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		slog.Warn("tmdb detail returned error", "id", id, "type", mediaType, "status", resp.StatusCode)
		return genres, "", 0
	}
	var detail struct {
		Genres []struct {
			Name string `json:"name"`
		} `json:"genres"`
		NumberOfSeasons int `json:"number_of_seasons"` // series only; 0 for movies
		WatchProviders  struct {
			Results map[string]struct {
				Flatrate []struct {
					ProviderName string `json:"provider_name"`
				} `json:"flatrate"`
			} `json:"results"`
		} `json:"watch/providers"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&detail); err != nil {
		slog.Warn("tmdb detail decode failed", "id", id, "err", err)
		return genres, "", 0
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
	return genres, platform, detail.NumberOfSeasons
}
