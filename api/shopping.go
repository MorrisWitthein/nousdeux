package main

import (
	"log/slog"
	"net/http"
)

func (app *App) handleShoppingList(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		listResource[ShoppingItem](w, r, app.pool,
			`SELECT id, name, qty, checked, who, created_at FROM shopping_items ORDER BY created_at ASC`)

	case http.MethodPost:
		var item ShoppingItem
		if !decodeBody(w, r, &item, 1<<20) {
			return
		}
		if item.Name == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}
		item.Who = userFromContext(ctx)
		err := app.pool.QueryRow(ctx,
			`INSERT INTO shopping_items (name, qty, who) VALUES ($1,$2,$3) RETURNING id, created_at`,
			item.Name, item.Qty, item.Who,
		).Scan(&item.ID, &item.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
			return
		}
		_, _ = app.pool.Exec(ctx,
			`INSERT INTO shopping_history (name) VALUES ($1) ON CONFLICT DO NOTHING`, item.Name)
		slog.Info("shopping item created", "id", item.ID, "name", item.Name)
		app.shoppingBroker.Notify()
		writeJSON(w, http.StatusCreated, item)

	case http.MethodPatch:
		id, ok := requireID(w, r)
		if !ok {
			return
		}
		var patch struct {
			Checked bool `json:"checked"`
		}
		if !decodeBody(w, r, &patch, 1<<20) {
			return
		}
		tag, err := app.pool.Exec(ctx,
			`UPDATE shopping_items SET checked=$1 WHERE id=$2`,
			patch.Checked, id,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("shopping item updated", "id", id, "checked", patch.Checked)
		app.shoppingBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		app.deleteResource(w, r, "shopping_items", app.shoppingBroker, nil)

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (app *App) handleShoppingHistory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	rows, err := app.pool.Query(ctx, `SELECT name FROM shopping_history ORDER BY name ASC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query: "+err.Error())
		return
	}
	defer rows.Close()
	names := []string{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
			return
		}
		names = append(names, name)
	}
	writeJSON(w, http.StatusOK, names)
}
