-- Add richer recipe fields: ingredients, steps, prep_time, servings.
-- Change rating from free text to integer (1–5 stars).
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS steps TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS prep_time INT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS servings INT;

-- Migrate existing emoji-string ratings to integers.
-- "–" or empty → 0, count "⭐" occurrences otherwise.
UPDATE recipes SET rating = CASE
  WHEN rating IS NULL OR rating = '–' OR rating = '' THEN '0'
  WHEN rating ~ '^\d+$' THEN rating  -- already numeric
  ELSE (LENGTH(rating) - LENGTH(REPLACE(rating, '⭐', '')))::TEXT
END;

ALTER TABLE recipes ALTER COLUMN rating DROP DEFAULT;
ALTER TABLE recipes ALTER COLUMN rating TYPE INT USING COALESCE(rating::INT, 0);
ALTER TABLE recipes ALTER COLUMN rating SET DEFAULT 0;

-- Add optional scheduled date/time to activities.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS time TEXT;
