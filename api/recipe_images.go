package main

import (
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"

	"golang.org/x/image/draw"
)

const maxDimension = 800 // resize to fit within 800×800

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
func handleRecipeUploadImage(w http.ResponseWriter, r *http.Request) {
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
	if err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM recipes WHERE id=$1)`, id).Scan(&exists); err != nil || !exists {
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
