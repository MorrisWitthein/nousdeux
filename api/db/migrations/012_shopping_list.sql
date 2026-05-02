CREATE TABLE IF NOT EXISTS shopping_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  checked    BOOLEAN     NOT NULL DEFAULT FALSE,
  who        TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
