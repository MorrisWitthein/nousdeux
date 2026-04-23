CREATE TABLE IF NOT EXISTS movies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji       TEXT,
  title       TEXT NOT NULL,
  sub         TEXT,
  status      TEXT DEFAULT 'Geplant',
  status_type TEXT DEFAULT 'yellow',
  created_at  TIMESTAMPTZ DEFAULT now()
);
