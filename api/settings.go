package main

import (
	"context"
	"encoding/json"
	"net/http"
)

func (app *App) loadSettings(ctx context.Context) (map[string]any, error) {
	rows, err := app.pool.Query(ctx, `SELECT key, value FROM settings`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]any{}
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			return nil, err
		}
		switch v {
		case "true":
			out[k] = true
		case "false":
			out[k] = false
		default:
			out[k] = v
		}
	}
	return out, nil
}

func (app *App) handleSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		s, err := app.loadSettings(ctx)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, s)

	case http.MethodPatch:
		if !isAdminFromContext(ctx) {
			writeError(w, http.StatusForbidden, "admin required")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var patch map[string]any
		if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON")
			return
		}
		for k, v := range patch {
			var val string
			switch b := v.(type) {
			case bool:
				if b {
					val = "true"
				} else {
					val = "false"
				}
			default:
				writeError(w, http.StatusBadRequest, "unsupported value type for key: "+k)
				return
			}
			if _, err := app.pool.Exec(ctx,
				`INSERT INTO settings (key, value) VALUES ($1, $2)
				 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
				k, val,
			); err != nil {
				writeError(w, http.StatusInternalServerError, "update: "+err.Error())
				return
			}
		}
		s, err := app.loadSettings(ctx)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "query: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, s)

	default:
		w.Header().Set("Allow", "GET, PATCH, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
