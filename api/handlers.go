package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
)

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Event, len(events))
		copy(out, events)
		mu.RUnlock()
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
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
		if e.Who == "" {
			writeError(w, http.StatusBadRequest, "who is required")
			return
		}
		e.ID = uuid.New().String()
		e.CreatedAt = time.Now().UTC().Format(time.RFC3339)

		mu.Lock()
		events = append(events, e)
		mu.Unlock()

		slog.Info("event created", "id", e.ID, "title", e.Title)
		eventsBroker.Notify()
		writeJSON(w, http.StatusCreated, e)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleRecipes(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Recipe, len(recipes))
		copy(out, recipes)
		mu.RUnlock()
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
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
		if rec.Who == "" {
			writeError(w, http.StatusBadRequest, "who is required")
			return
		}
		rec.ID = uuid.New().String()
		rec.CreatedAt = time.Now().UTC().Format(time.RFC3339)
		if rec.Rating == "" {
			rec.Rating = "–"
		}

		mu.Lock()
		recipes = append(recipes, rec)
		mu.Unlock()

		slog.Info("recipe created", "id", rec.ID, "title", rec.Title)
		recipesBroker.Notify()
		writeJSON(w, http.StatusCreated, rec)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleSeries(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Series, len(series))
		copy(out, series)
		mu.RUnlock()
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
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
		s.ID = uuid.New().String()
		s.CreatedAt = time.Now().UTC().Format(time.RFC3339)
		if s.Status == "" {
			s.Status = "Geplant"
		}
		if s.StatusType == "" {
			s.StatusType = "yellow"
		}

		mu.Lock()
		series = append(series, s)
		mu.Unlock()

		slog.Info("series created", "id", s.ID, "title", s.Title)
		seriesBroker.Notify()
		writeJSON(w, http.StatusCreated, s)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleActivities(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Activity, len(activities))
		copy(out, activities)
		mu.RUnlock()
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
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
		if a.Who == "" {
			writeError(w, http.StatusBadRequest, "who is required")
			return
		}
		a.ID = uuid.New().String()
		a.CreatedAt = time.Now().UTC().Format(time.RFC3339)

		mu.Lock()
		activities = append(activities, a)
		mu.Unlock()

		slog.Info("activity created", "id", a.ID, "title", a.Title)
		activitiesBroker.Notify()
		writeJSON(w, http.StatusCreated, a)

	default:
		w.Header().Set("Allow", "GET, POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
