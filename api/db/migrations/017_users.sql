-- User accounts move out of the USERS/ADMINS env vars into the database so
-- passwords can be changed at runtime. On startup the API seeds this table
-- from those env vars (INSERT ... ON CONFLICT DO NOTHING), so existing
-- accounts migrate automatically and env stays a lossless fallback for the
-- seeded users (it never overwrites a row, so runtime changes survive).
CREATE TABLE IF NOT EXISTS users (
    username   TEXT PRIMARY KEY,
    password   TEXT NOT NULL,        -- bcrypt hash
    is_admin   BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
