package sse

import (
	"fmt"
	"log/slog"
	"net/http"
	"sync"
)

// Broker fans out "refresh" events to all connected SSE clients.
type Broker struct {
	mu      sync.Mutex
	clients map[chan struct{}]struct{}
}

func NewBroker() *Broker {
	return &Broker{clients: make(map[chan struct{}]struct{})}
}

// Notify signals all connected clients to refresh.
func (b *Broker) Notify() {
	b.mu.Lock()
	defer b.mu.Unlock()
	for ch := range b.clients {
		select {
		case ch <- struct{}{}:
		default: // don't block if client is slow
		}
	}
}

// ServeHTTP is the SSE stream endpoint handler.
func (b *Broker) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	ch := make(chan struct{}, 1)
	b.mu.Lock()
	b.clients[ch] = struct{}{}
	b.mu.Unlock()

	defer func() {
		b.mu.Lock()
		delete(b.clients, ch)
		b.mu.Unlock()
	}()

	ctx := r.Context()
	slog.Info("sse client connected", "path", r.URL.Path)

	for {
		select {
		case <-ctx.Done():
			slog.Info("sse client disconnected", "path", r.URL.Path)
			return
		case <-ch:
			fmt.Fprintf(w, "data: refresh\n\n")
			flusher.Flush()
		}
	}
}
