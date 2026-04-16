CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  date       TEXT,
  time       TEXT,
  who        CHAR(1) NOT NULL,
  badge      TEXT,
  badge_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji      TEXT,
  title      TEXT NOT NULL,
  tags       TEXT[],
  who        CHAR(1) NOT NULL,
  rating     TEXT DEFAULT '–',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji       TEXT,
  title       TEXT NOT NULL,
  sub         TEXT,
  progress    INT DEFAULT 0,
  status      TEXT DEFAULT 'Geplant',
  status_type TEXT DEFAULT 'yellow',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji      TEXT,
  title      TEXT NOT NULL,
  meta       TEXT,
  who        CHAR(1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
