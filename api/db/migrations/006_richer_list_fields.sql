-- Series: track which season you're on instead of an opaque 0-100 progress %.
ALTER TABLE series ADD COLUMN IF NOT EXISTS season INT DEFAULT 0;

-- Movies: store genre separately from platform (sub becomes platform label).
ALTER TABLE movies ADD COLUMN IF NOT EXISTS genre TEXT;

-- Activities: bucket-list status so couples can check things off.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Idee';
