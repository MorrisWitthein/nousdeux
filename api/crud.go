package main

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mwitthein/nousdeux-api/sse"
)

// nullIfEmpty returns nil for empty strings so Postgres uses the column DEFAULT.
func nullIfEmpty(s string) any {
	if s == "" {
		return nil
	}
	return s
}

// requireID reads the `id` query parameter, writing a 400 and returning
// ok=false when it is absent — mirroring the inline guard each handler used.
func requireID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id is required")
		return "", false
	}
	return id, true
}

// decodeBody caps the request body at limit bytes and decodes it into dst,
// writing a 400 and returning false on a decode error — mirroring the inline
// MaxBytesReader + json.Decode guard each handler used.
func decodeBody(w http.ResponseWriter, r *http.Request, dst any, limit int64) bool {
	r.Body = http.MaxBytesReader(w, r.Body, limit)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return false
	}
	return true
}

// listResource runs a GET collection query, scans rows into []T by position,
// and writes the JSON array — the shared shape of every resource's GET branch.
// It is a free function because Go does not permit type-parameterized methods.
func listResource[T any](w http.ResponseWriter, r *http.Request, pool *pgxpool.Pool, query string) {
	rows, err := pool.Query(r.Context(), query)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query: "+err.Error())
		return
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[T])
	if err != nil {
		writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

// deleteResource reproduces the shared DELETE branch: id-required → DELETE →
// rows-affected check → optional after(id) cleanup → broker notify → respond.
func (app *App) deleteResource(w http.ResponseWriter, r *http.Request, table string, broker *sse.Broker, after func(id string)) {
	id, ok := requireID(w, r)
	if !ok {
		return
	}
	tag, err := app.pool.Exec(r.Context(), `DELETE FROM `+table+` WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "delete: "+err.Error())
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if after != nil {
		after(id)
	}
	slog.Info(table+" deleted", "id", id)
	broker.Notify()
	writeJSON(w, http.StatusOK, map[string]string{"deleted": id})
}
