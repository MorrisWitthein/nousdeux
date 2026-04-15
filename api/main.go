package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Event mirrors the DB schema from PLAN.md.
type Event struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Date      string `json:"date,omitempty"`
	Time      string `json:"time,omitempty"`
	Who       string `json:"who"`
	Badge     string `json:"badge,omitempty"`
	BadgeType string `json:"badge_type,omitempty"`
	CreatedAt string `json:"created_at"`
}

var (
	mu     sync.RWMutex
	events []Event
)

func newUUID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant bits
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// cors wraps a handler with permissive CORS headers for local dev.
func cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func handleEvents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		mu.RLock()
		out := make([]Event, len(events))
		copy(out, events)
		mu.RUnlock()
		// Newest first.
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(out); err != nil {
			log.Printf("encode events: %v", err)
		}

	case http.MethodPost:
		var e Event
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}
		if e.Title == "" {
			http.Error(w, "title is required", http.StatusBadRequest)
			return
		}
		e.ID = newUUID()
		e.CreatedAt = time.Now().UTC().Format(time.RFC3339)

		mu.Lock()
		events = append(events, e)
		mu.Unlock()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		if err := json.NewEncoder(w).Encode(e); err != nil {
			log.Printf("encode event: %v", err)
		}

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func main() {
	http.HandleFunc("/api/events", cors(handleEvents))

	addr := ":8080"
	log.Printf("nosdeux API listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
