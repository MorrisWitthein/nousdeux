-- Attribution: track who added each series / movie, matching events, recipes
-- and activities. Existing rows default to '' (rendered as "no author" client-side).
ALTER TABLE series ADD COLUMN IF NOT EXISTS who TEXT DEFAULT '';
ALTER TABLE movies ADD COLUMN IF NOT EXISTS who TEXT DEFAULT '';
