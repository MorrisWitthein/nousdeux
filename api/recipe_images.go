package main

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/image/draw"
)

const maxDimension = 800 // resize to fit within 800×800

// handleRecipeImage proxies image search to Unsplash (GET) and stores the result (PATCH).
func (app *App) handleRecipeImage(w http.ResponseWriter, r *http.Request) {
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
		// Remove an old uploaded file unless the new URL points to it
		// (upload flow: store file first, then PATCH with the new URL).
		if !strings.Contains(body.URL, "/api/recipes/"+id+"/image-file") {
			removeRecipeImageFile(id)
		}
		tag, err := app.pool.Exec(ctx, `UPDATE recipes SET image_url=$1 WHERE id=$2`, nullIfEmpty(body.URL), id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "update: "+err.Error())
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "not found")
			return
		}
		slog.Info("recipe image set", "id", id)
		app.recipesBroker.Notify()
		writeJSON(w, http.StatusOK, map[string]string{"updated": id})

	default:
		w.Header().Set("Allow", "GET, PATCH, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// removeRecipeImageFile deletes an uploaded recipe image from disk, ignoring
// errors if the file never existed (e.g. the image was an external URL).
func removeRecipeImageFile(id string) {
	path := filepath.Join(attachmentsDir, "recipe-images", filepath.Base(id))
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		slog.Warn("recipe image cleanup", "id", id, "err", err)
	}
}

// handleRecipeUploadImage accepts a multipart image, stores it to disk, and
// returns the serving path. The client is responsible for PATCHing image_url
// with the full URL constructed from its API base.
func (app *App) handleRecipeUploadImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "recipe id required")
		return
	}
	ctx := r.Context()

	var exists bool
	if err := app.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM recipes WHERE id=$1)`, id).Scan(&exists); err != nil || !exists {
		writeError(w, http.StatusNotFound, "recipe not found")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize+1024)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "file too large or invalid form")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file field required")
		return
	}
	defer file.Close()

	dir := filepath.Join(attachmentsDir, "recipe-images")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		writeError(w, http.StatusInternalServerError, "mkdir: "+err.Error())
		return
	}

	dest := filepath.Join(dir, filepath.Base(id))
	f, err := os.Create(dest)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "create: "+err.Error())
		return
	}
	defer f.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		os.Remove(dest)
		writeError(w, http.StatusBadRequest, "invalid image: "+err.Error())
		return
	}
	if err := encodeResized(f, img); err != nil {
		os.Remove(dest)
		writeError(w, http.StatusInternalServerError, "encode: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"path": "/api/recipes/" + id + "/image-file"})
}

// handleRecipeImageFile serves a previously uploaded recipe image.
// No auth required so <img> tags can load it directly.
func handleRecipeImageFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET, OPTIONS")
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "recipe id required")
		return
	}

	path := filepath.Join(attachmentsDir, "recipe-images", filepath.Base(id))
	f, err := os.Open(path)
	if err != nil {
		writeError(w, http.StatusNotFound, "image not found")
		return
	}
	defer f.Close()

	// Detect content type from first 512 bytes, then seek back.
	buf := make([]byte, 512)
	n, _ := f.Read(buf)
	contentType := http.DetectContentType(buf[:n])
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		writeError(w, http.StatusInternalServerError, "seek: "+err.Error())
		return
	}

	info, _ := f.Stat()
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	if info != nil {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", info.Size()))
	}
	io.Copy(w, f)
}

// encodeResized writes src as JPEG to w, scaling it down if either dimension
// exceeds maxDimension. Aspect ratio is preserved.
func encodeResized(w io.Writer, src image.Image) error {
	b := src.Bounds()
	width, height := b.Dx(), b.Dy()
	if width <= maxDimension && height <= maxDimension {
		return jpeg.Encode(w, src, &jpeg.Options{Quality: 85})
	}
	var newW, newH int
	if width > height {
		newW = maxDimension
		newH = height * maxDimension / width
	} else {
		newH = maxDimension
		newW = width * maxDimension / height
	}
	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, b, draw.Over, nil)
	return jpeg.Encode(w, dst, &jpeg.Options{Quality: 85})
}
