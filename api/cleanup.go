package main

import (
	"context"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5"
)

func startCleanupWorker(ctx context.Context) {
	go func() {
		runCleanup(ctx)
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				runCleanup(ctx)
			case <-ctx.Done():
				return
			}
		}
	}()
}

func runCleanup(ctx context.Context) {
	cutoff := time.Now().AddDate(0, 0, -7).Format("2006-01-02")

	rows, err := pool.Query(ctx, `
		SELECT ea.id, ea.event_id, ea.filename
		FROM event_attachments ea
		JOIN events e ON e.id = ea.event_id
		WHERE COALESCE(NULLIF(e.end_date, ''), e.date) < $1
	`, cutoff)
	if err != nil {
		slog.Error("cleanup: query failed", "err", err)
		return
	}

	type row struct {
		ID      string
		EventID string
		Name    string
	}
	stale, err := pgx.CollectRows(rows, pgx.RowToStructByPos[row])
	if err != nil {
		slog.Error("cleanup: scan failed", "err", err)
		return
	}
	if len(stale) == 0 {
		return
	}

	ids := make([]string, len(stale))
	eventDirs := map[string]struct{}{}
	for i, a := range stale {
		ids[i] = a.ID
		path := filepath.Join(attachmentsDir, a.EventID, a.ID+"_"+sanitizeFilename(a.Name))
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			slog.Warn("cleanup: remove file", "path", path, "err", err)
		}
		eventDirs[a.EventID] = struct{}{}
	}

	_, err = pool.Exec(ctx, `DELETE FROM event_attachments WHERE id = ANY($1)`, ids)
	if err != nil {
		slog.Error("cleanup: db delete failed", "err", err)
		return
	}

	for eventID := range eventDirs {
		dir := filepath.Join(attachmentsDir, eventID)
		entries, err := os.ReadDir(dir)
		if err == nil && len(entries) == 0 {
			os.Remove(dir)
		}
	}

	slog.Info("cleanup: removed stale attachments", "count", len(stale))
}
