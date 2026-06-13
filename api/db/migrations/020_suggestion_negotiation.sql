-- Counter-proposals: the recipient can propose a different date/time, bouncing
-- the suggestion back to the originator. `awaiting` tracks whose turn it is,
-- relative to suggested_by, so routing never needs the other user's name:
--   'recipient' → the non-suggester must respond (initial state)
--   'sender'    → the original suggester must respond (after a counter)
-- `last_proposed_by` records who made the currently-open proposal, for display.
ALTER TABLE event_suggestions ADD COLUMN IF NOT EXISTS awaiting TEXT;
ALTER TABLE event_suggestions ADD COLUMN IF NOT EXISTS last_proposed_by TEXT;

-- Backfill existing rows: a pending suggestion is awaiting its recipient, and the
-- only proposal so far was the suggester's own.
UPDATE event_suggestions SET awaiting = 'recipient' WHERE awaiting IS NULL AND status = 'pending';
UPDATE event_suggestions SET last_proposed_by = suggested_by WHERE last_proposed_by IS NULL;
