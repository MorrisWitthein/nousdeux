-- Replace single-genre text column with a genres array, migrating existing data.
ALTER TABLE movies ADD COLUMN IF NOT EXISTS genres TEXT[];
UPDATE movies SET genres = ARRAY[genre] WHERE genre IS NOT NULL AND genre != '';
ALTER TABLE movies DROP COLUMN IF EXISTS genre;
