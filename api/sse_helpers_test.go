package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/mwitthein/nousdeux-api/sse"
)

// sseSink is a flushable ResponseWriter that signals on every Flush, letting a
// test observe when the broker pushes a "refresh" to a connected client.
type sseSink struct {
	hdr     http.Header
	flushed chan struct{}
}

func (s *sseSink) Header() http.Header         { return s.hdr }
func (s *sseSink) Write(b []byte) (int, error) { return len(b), nil }
func (s *sseSink) WriteHeader(int)             {}
func (s *sseSink) Flush() {
	select {
	case s.flushed <- struct{}{}:
	default:
	}
}

// subscribe connects a fake SSE client to broker via its real ServeHTTP and
// returns notified(), which reports whether a refresh arrives within a short
// window. It blocks until the client is registered (confirmed by a self-notify
// round-trip), so a notify fired right after it returns is reliably observed.
func subscribe(t *testing.T, broker *sse.Broker) func() bool {
	t.Helper()
	sink := &sseSink{hdr: http.Header{}, flushed: make(chan struct{}, 8)}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	req := httptest.NewRequest(http.MethodGet, "/stream", nil).WithContext(ctx)
	go broker.ServeHTTP(sink, req)

	// Confirm registration: keep notifying until a flush comes back. Notifies
	// sent before the client registers are dropped (non-blocking), so we retry.
	deadline := time.After(2 * time.Second)
	for registered := false; !registered; {
		broker.Notify()
		select {
		case <-sink.flushed:
			registered = true
		case <-time.After(20 * time.Millisecond):
		case <-deadline:
			t.Fatal("broker never delivered to a subscribed client")
		}
	}

	// Drain any extra confirmation signals so notified() observes only the
	// next notify (the one the action under test triggers).
	for draining := true; draining; {
		select {
		case <-sink.flushed:
		default:
			draining = false
		}
	}

	return func() bool {
		select {
		case <-sink.flushed:
			return true
		case <-time.After(2 * time.Second):
			return false
		}
	}
}
