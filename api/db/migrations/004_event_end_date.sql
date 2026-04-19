-- Add optional end date for multi-day events (e.g. holidays, trips).
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TEXT;
