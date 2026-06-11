package main

import (
	"log/slog"
	"net/http"
)

func (app *App) handleRecipes(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	switch r.Method {
	case http.MethodGet:
		listResource[Recipe](w, r, app.pool,
			`SELECT id, COALESCE(emoji,''), title, COALESCE(tags,'{}'),
			        who, COALESCE(rating,0),
			        COALESCE(ingredients,''), COALESCE(steps,''),
			        prep_time, servings, COALESCE(image_url,''), created_at
			 FROM recipes ORDER BY created_at DESC`)

	case http.MethodPost:
		var rec Recipe
		if !decodeBody(w, r, &rec, 1<<20) {
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
		err := app.pool.QueryRow(ctx,
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
		app.recipesBroker.Notify()
		writeJSON(w, http.StatusCreated, rec)

	case http.MethodPatch:
		id, ok := requireID(w, r)
		if !ok {
			return
		}
		var rec Recipe
		if !decodeBody(w, r, &rec, 1<<20) {
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
		tag, err := app.pool.Exec(ctx,
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
		app.recipesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	case http.MethodDelete:
		app.deleteResource(w, r, "recipes", app.recipesBroker, removeRecipeImageFile)

	default:
		w.Header().Set("Allow", "GET, POST, PATCH, DELETE, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
