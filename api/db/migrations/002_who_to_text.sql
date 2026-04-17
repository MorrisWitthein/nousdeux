-- Widen who from CHAR(1) to TEXT so we can store full usernames.
ALTER TABLE events     ALTER COLUMN who TYPE TEXT;
ALTER TABLE recipes    ALTER COLUMN who TYPE TEXT;
ALTER TABLE activities ALTER COLUMN who TYPE TEXT;
