-- Track the total number of seasons a series has, so the UI can show progress
-- ("Staffel 2 / 5") against the current `season`. Auto-filled from TMDB
-- (number_of_seasons) on pick, editable by hand. 0 means "unknown".
ALTER TABLE series ADD COLUMN IF NOT EXISTS total_seasons INT DEFAULT 0;
