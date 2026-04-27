-- Backfill any events that somehow have no date, then enforce NOT NULL.
UPDATE events SET date = to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') WHERE date IS NULL;
ALTER TABLE events ALTER COLUMN date SET NOT NULL;
