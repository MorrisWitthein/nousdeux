package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
"github.com/jackc/pgx/v5"
)

const maxUploadSize = 20 << 20 // 20 MB

var attachmentsDir string

// handleEventAttachments handles GET and POST on /api/events/{id}/attachments.
func handleEventAttachments(w http.ResponseWriter, r *http.Request) {
	eventID := r.PathValue("id")
	if eventID == "" {
		writeError(w, http.StatusBadRequest, "event id required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		listAttachments(w, r, eventID)
	case http.MethodPost:
		uploadAttachment(w, r, eventID)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// handleAttachment handles GET and DELETE on /api/attachments/{id}.
func handleAttachment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "attachment id required")
		return
	}

	switch r.Method {
	case http.MethodGet:
		serveAttachment(w, r, id)
	case http.MethodDelete:
		deleteAttachment(w, r, id)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func listAttachments(w http.ResponseWriter, r *http.Request, eventID string) {
	ctx := r.Context()
	rows, err := pool.Query(ctx,
		`SELECT id, event_id, filename, content_type, size, uploaded_by, created_at
		 FROM event_attachments WHERE event_id = $1 ORDER BY created_at ASC`, eventID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query: "+err.Error())
		return
	}
	out, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Attachment])
	if err != nil {
		writeError(w, http.StatusInternalServerError, "scan: "+err.Error())
		return
	}
	if out == nil {
		out = []Attachment{}
	}
	writeJSON(w, http.StatusOK, out)
}

func uploadAttachment(w http.ResponseWriter, r *http.Request, eventID string) {
	ctx := r.Context()
	user := userFromContext(ctx)

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize+1024)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "file too large or invalid form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file field required")
		return
	}
	defer file.Close()

	if header.Size > maxUploadSize {
		writeError(w, http.StatusBadRequest, "file exceeds 20 MB limit")
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Verify event exists.
	var exists bool
	if err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM events WHERE id=$1)`, eventID).Scan(&exists); err != nil || !exists {
		writeError(w, http.StatusNotFound, "event not found")
		return
	}

	// Insert metadata first to get the UUID.
	var id string
	err = pool.QueryRow(ctx,
		`INSERT INTO event_attachments (event_id, filename, content_type, size, uploaded_by)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		eventID, header.Filename, contentType, header.Size, user,
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "insert: "+err.Error())
		return
	}

	// Persist file to disk under <attachmentsDir>/<eventID>/<uuid>_<filename>.
	dir := filepath.Join(attachmentsDir, eventID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		// Roll back DB row.
		pool.Exec(ctx, `DELETE FROM event_attachments WHERE id=$1`, id)
		writeError(w, http.StatusInternalServerError, "mkdir: "+err.Error())
		return
	}

	dest := filepath.Join(dir, id+"_"+sanitizeFilename(header.Filename))
	f, err := os.Create(dest)
	if err != nil {
		pool.Exec(ctx, `DELETE FROM event_attachments WHERE id=$1`, id)
		writeError(w, http.StatusInternalServerError, "create file: "+err.Error())
		return
	}
	defer f.Close()

	if _, err := io.Copy(f, file); err != nil {
		pool.Exec(ctx, `DELETE FROM event_attachments WHERE id=$1`, id)
		os.Remove(dest)
		writeError(w, http.StatusInternalServerError, "write file: "+err.Error())
		return
	}

	var a Attachment
	err = pool.QueryRow(ctx,
		`SELECT id, event_id, filename, content_type, size, uploaded_by, created_at
		 FROM event_attachments WHERE id=$1`, id).
		Scan(&a.ID, &a.EventID, &a.Filename, &a.ContentType, &a.Size, &a.UploadedBy, &a.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "fetch: "+err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, a)
}

func serveAttachment(w http.ResponseWriter, r *http.Request, id string) {
	ctx := r.Context()

	var a Attachment
	err := pool.QueryRow(ctx,
		`SELECT id, event_id, filename, content_type, size, uploaded_by, created_at
		 FROM event_attachments WHERE id=$1`, id).
		Scan(&a.ID, &a.EventID, &a.Filename, &a.ContentType, &a.Size, &a.UploadedBy, &a.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "attachment not found")
		return
	}

	path := filepath.Join(attachmentsDir, a.EventID, id+"_"+sanitizeFilename(a.Filename))
	f, err := os.Open(path)
	if err != nil {
		writeError(w, http.StatusNotFound, "file not found on disk")
		return
	}
	defer f.Close()

	w.Header().Set("Content-Type", a.ContentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, a.Filename))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", a.Size))
	io.Copy(w, f)
}

func deleteAttachment(w http.ResponseWriter, r *http.Request, id string) {
	ctx := r.Context()

	var a Attachment
	err := pool.QueryRow(ctx,
		`DELETE FROM event_attachments WHERE id=$1
		 RETURNING id, event_id, filename, content_type, size, uploaded_by, created_at`, id).
		Scan(&a.ID, &a.EventID, &a.Filename, &a.ContentType, &a.Size, &a.UploadedBy, &a.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "attachment not found")
		return
	}

	path := filepath.Join(attachmentsDir, a.EventID, id+"_"+sanitizeFilename(a.Filename))
	os.Remove(path)

	writeJSON(w, http.StatusOK, map[string]string{"deleted": id})
}

// sanitizeFilename strips all directory components, preventing path traversal.
func sanitizeFilename(name string) string {
	return filepath.Base(name)
}
