-- Event suggestions: one user proposes an event the other can accept (creating a
-- real events row) or decline. Columns mirror events plus the suggestion lifecycle
-- (suggested_by, status, resolved_at). Kept separate from events so unconfirmed
-- suggestions never show up on the shared calendar.
CREATE TABLE IF NOT EXISTS event_suggestions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  date         TEXT,
  end_date     TEXT,
  time         TEXT,
  badge        TEXT,
  badge_type   TEXT,
  suggested_by TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);
