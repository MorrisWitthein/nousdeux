package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5"
)

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "version": version})
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, title, COALESCE(date,''), COALESCE(end_date,''), COALESCE(time,''),
			        who, COALESCE(badge,''), COALESCE(badge_type,''), created_at,
			        COALESCE(ac.c, 0)
			 FROM events
			 LEFT JOIN (SELECT event_id, COUNT(*) AS c FROM event_attachments GROUP BY event_id) ac
			   ON ac.event_id = events.id
			 ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Event])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var e Event
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if e.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateEvent(e); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		e.Who = userFromContext(ctx)
		err := pool.QueryRow(ctx,
			`INSERT INTO events (title, date, end_date, time, who, badge, badge_type)
			 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
			e.Title, nullIfEmpty(e.Date), nullIfEmpty(e.EndDate), nullIfEmpty(e.Time), e.Who, nullIfEmpty(e.Badge), nullIfEmpty(e.BadgeType),
		).Scan(&e.ID, &e.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("event created", "id", e.ID, "title", e.Title)
		eventsBroker.Notify()
		writeJSON(w, http.StatusCreated, e)

	case http.MethodPatch:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var e Event
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if e.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateEvent(e); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		tag, err := pool.Exec(ctx,
			`UPDATE events SET title=$1, date=$2, end_date=$3, time=$4, badge=$5, badge_type=$6
			 WHERE id=$7`,
			e.Title, nullIfEmpty(e.Date), nullIfEmpty(e.EndDate), nullIfEmpty(e.Time),
			nullIfEmpty(e.Badge), nullIfEmpty(e.BadgeType), id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("event updated", "id", id)
		eventsBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM events WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		os.RemoveAll(filepath.Join(attachmentsDir, id))
		slog.Info("event deleted", "id", id)
		eventsBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleRecipes(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(tags,'{}'),
			        who, COALESCE(rating,0),
			        COALESCE(ingredients,''), COALESCE(steps,''),
			        prep_time, servings, COALESCE(image_url,''), created_at
			 FROM recipes ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Recipe])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var rec Recipe
		if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if rec.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateRecipe(rec); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		rec.Who = userFromContext(ctx)
		err := pool.QueryRow(ctx,
			`INSERT INTO recipes (emoji, title, tags, who, rating, ingredients, steps, prep_time, servings)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at`,
			nullIfEmpty(rec.Emoji), rec.Title, rec.Tags, rec.Who, rec.Rating,
			nullIfEmpty(rec.Ingredients), nullIfEmpty(rec.Steps), rec.PrepTime, rec.Servings,
		).Scan(&rec.ID, &rec.CreatedAt)
		// image_url is set separately via PATCH /api/recipes/image after the client fetches one
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("recipe created", "id", rec.ID, "title", rec.Title)
		recipesBroker.Notify()
		writeJSON(w, http.StatusCreated, rec)

	case http.MethodPatch:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var rec Recipe
		if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if rec.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateRecipe(rec); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		tag, err := pool.Exec(ctx,
			`UPDATE recipes SET emoji=$1, title=$2, tags=$3, rating=$4,
			 ingredients=$5, steps=$6, prep_time=$7, servings=$8
			 WHERE id=$9`,
			nullIfEmpty(rec.Emoji), rec.Title, rec.Tags, rec.Rating,
			nullIfEmpty(rec.Ingredients), nullIfEmpty(rec.Steps), rec.PrepTime, rec.Servings, id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("recipe updated", "id", id)
		recipesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM recipes WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("recipe deleted", "id", id)
		recipesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleSeries(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(sub,''),
			        COALESCE(progress,0), COALESCE(season,0),
			        COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'), created_at
			 FROM series ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Series])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var s Series
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if s.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateSeries(s); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		err := pool.QueryRow(ctx,
			`INSERT INTO series (emoji, title, sub, progress, season, status, status_type)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)
			 RETURNING id, COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'), created_at`,
			nullIfEmpty(s.Emoji), s.Title, nullIfEmpty(s.Sub), s.Progress, s.Season,
			nullIfEmpty(s.Status), nullIfEmpty(s.StatusType),
		).Scan(&s.ID, &s.Status, &s.StatusType, &s.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("series created", "id", s.ID, "title", s.Title)
		seriesBroker.Notify()
		writeJSON(w, http.StatusCreated, s)

	case http.MethodPatch:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var s Series
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if s.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateSeries(s); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		tag, err := pool.Exec(ctx,
			`UPDATE series SET emoji=$1, title=$2, sub=$3, progress=$4, season=$5, status=$6, status_type=$7
			 WHERE id=$8`,
			nullIfEmpty(s.Emoji), s.Title, nullIfEmpty(s.Sub),
			s.Progress, s.Season, nullIfEmpty(s.Status), nullIfEmpty(s.StatusType), id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("series updated", "id", id)
		seriesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM series WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("series deleted", "id", id)
		seriesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleActivities(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(meta,''),
			        who, COALESCE(date,''), COALESCE(time,''), COALESCE(status,'Idee'), created_at
			 FROM activities ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Activity])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var a Activity
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if a.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateActivity(a); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		a.Who = userFromContext(ctx)
		err := pool.QueryRow(ctx,
			`INSERT INTO activities (emoji, title, meta, who, date, time, status)
			 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
			nullIfEmpty(a.Emoji), a.Title, nullIfEmpty(a.Meta), a.Who,
			nullIfEmpty(a.Date), nullIfEmpty(a.Time), nullIfEmpty(a.Status),
		).Scan(&a.ID, &a.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("activity created", "id", a.ID, "title", a.Title)
		activitiesBroker.Notify()
		writeJSON(w, http.StatusCreated, a)

	case http.MethodPatch:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var a Activity
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if a.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateActivity(a); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		tag, err := pool.Exec(ctx,
			`UPDATE activities SET emoji=$1, title=$2, meta=$3, date=$4, time=$5, status=$6
			 WHERE id=$7`,
			nullIfEmpty(a.Emoji), a.Title, nullIfEmpty(a.Meta),
			nullIfEmpty(a.Date), nullIfEmpty(a.Time), nullIfEmpty(a.Status), id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("activity updated", "id", id)
		activitiesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM activities WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("activity deleted", "id", id)
		activitiesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleMovies(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		rows, err := pool.Query(ctx,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(sub,''),
			        COALESCE(genres,'{}'), COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'), created_at
			 FROM movies ORDER BY created_at DESC`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Movie])
		if err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, out)

	case http.MethodPost:
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var m Movie
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if m.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateMovie(m); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		genres := m.Genres
		if genres == nil {
			genres = []string{}
		}
		err := pool.QueryRow(ctx,
			`INSERT INTO movies (emoji, title, sub, genres, status, status_type)
			 VALUES ($1,$2,$3,$4,$5,$6)
			 RETURNING id, COALESCE(status,'Geplant'), COALESCE(status_type,'yellow'), created_at`,
			nullIfEmpty(m.Emoji), m.Title, nullIfEmpty(m.Sub), genres,
			nullIfEmpty(m.Status), nullIfEmpty(m.StatusType),
		).Scan(&m.ID, &m.Status, &m.StatusType, &m.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		slog.Info("movie created", "id", m.ID, "title", m.Title)
		moviesBroker.Notify()
		writeJSON(w, http.StatusCreated, m)

	case http.MethodPatch:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var m Movie
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
			return
		}
		if m.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}
		if err := validateMovie(m); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		patchGenres := m.Genres
		if patchGenres == nil {
			patchGenres = []string{}
		}
		tag, err := pool.Exec(ctx,
			`UPDATE movies SET emoji=$1, title=$2, sub=$3, genres=$4, status=$5, status_type=$6
			 WHERE id=$7`,
			nullIfEmpty(m.Emoji), m.Title, nullIfEmpty(m.Sub), patchGenres,
			nullIfEmpty(m.Status), nullIfEmpty(m.StatusType), id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("movie updated", "id", id)
		moviesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			writeError(w, http.StatusBadRequest, "id is required")
			return
		}
		tag, err := pool.Exec(ctx, `DELETE FROM movies WHERE id = $1`, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("movie deleted", "id", id)
		moviesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"deleted": id})

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// handleRecipeImage proxies image search to Unsplash (GET) and stores the result (PATCH).
func handleRecipeImage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		q := r.URL.Query().Get("q")
		if q == "" {
			writeError(w, http.StatusBadRequest, "q is required")
			return
		}
		key := os.Getenv("UNSPLASH_ACCESS_KEY")
		if key == "" {
			writeError(w, http.StatusServiceUnavailable, "image search not configured")
			return
		}
		apiURL := "https://api.unsplash.com/search/photos?query=" + url.QueryEscape(q+" food") +
			"&per_page=1&orientation=squarish&content_filter=high"
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "build request: "+err.Error())
			return
		}
		req.Header.Set("Authorization", "Client-ID "+key)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			slog.Error("unsplash fetch failed", "query", q, "err", err)
			writeError(w, http.StatusBadGateway, "upstream: "+err.Error())
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			slog.Error("unsplash returned error", "query", q, "status", resp.StatusCode)
			writeError(w, http.StatusBadGateway, "upstream status: "+resp.Status)
			return
		}
		var result struct {
			Results []struct {
				Urls struct {
					Small string `json:"small"`
				} `json:"urls"`
			} `json:"results"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || len(result.Results) == 0 {
			slog.Warn("unsplash no results", "query", q)
			writeError(w, http.StatusNotFound, "no image found")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"url": result.Results[0].Urls.Small})

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
		tag, err := pool.Exec(ctx, `UPDATE recipes SET image_url=$1 WHERE id=$2`, nullIfEmpty(body.URL), id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("recipe image set", "id", id)
		recipesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	default:
		w.Header().Set("Allow", "GET, PATCH, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// nullIfEmpty returns nil for empty strings so Postgres uses the column DEFAULT.
func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}
