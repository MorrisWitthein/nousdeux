## Context

Events are a standard CRUD resource: `api/events.go` validates and inserts into `events`, then calls `app.eventsBroker.Notify()`; the frontend `useEvents` hook loads via `/api/events` and subscribes to an SSE stream. The `App` struct (`api/app.go`) holds the pool, per-resource SSE brokers, and the JWT secret. Auth puts the current user in the request context (`userFromContext`). Settings/migrations are well established (`api/db/migrations/NNN_*.sql`, embedded and auto-run). There are exactly two users (Max & Lena); per `MEMORY.md`, both can edit any record — `who` is attribution, not access control.

This change adds a parallel, lighter-weight resource (`event_suggestions`) whose accept action promotes a suggestion into a real `events` row.

## Goals / Non-Goals

**Goals:**
- Suggest → notify the other user → accept (creates event) or decline.
- Live updates via SSE, consistent with existing resources.
- Reuse event validation and the event insert path on accept.

**Non-Goals:**
- No external push notifications (no web-push/email); "notification" means in-app surfacing.
- No multi-recipient routing — with two users, a suggestion is implicitly for "the other user".
- No editing of a suggestion after creation (create / accept / decline only); edit-then-accept can come later.
- No access-control change to events (both users can already manage events).

## Decisions

**Decision: New `event_suggestions` table, separate from `events`.**
Columns mirror `events` (title, date, end_date, time, badge, badge_type) plus `suggested_by`, `status` (`pending` | `accepted` | `declined`), `created_at`, `resolved_at`. Keeping it separate avoids polluting the calendar with non-confirmed items and keeps the events table semantics intact.
- *Alternative considered:* a `status` column on `events`. Rejected — would force every event query/UI to filter out suggestions and risks accidental display on the calendar.

**Decision: "Other user" is derived, not stored as a recipient.**
With two users, the recipient is "whoever is not `suggested_by`". The notifications query for the current user returns pending suggestions where `suggested_by != currentUser`. This avoids a recipient column and matching logic.

**Decision: Accept reuses the event insert path and validation.**
The accept handler validates the suggestion's fields with the existing `validateEvent`, inserts into `events` (attribution per product choice — default: the original suggester as `who`, so it reads as their event; revisit during implementation), sets the suggestion `status='accepted'`, `resolved_at=now`, and notifies both the events broker and the suggestions broker.
- *Alternative considered:* duplicate insert SQL. Rejected — reuse the events insert to stay DRY and consistent with validation.

**Decision: A dedicated suggestions SSE broker on `App`.**
Add `suggestionsBroker` alongside the existing brokers in `api/app.go`, with a stream endpoint mirroring the others. Create/accept/decline call `Notify()`. Accept also calls `eventsBroker.Notify()` so the calendar updates live.

**Decision: Frontend mirrors the `useEvents` hook.**
`useEventSuggestions` fetches `/api/event-suggestions` and subscribes via `connectStream`. The suggest affordance lives in the calendar event form ("Vorschlagen" vs. "Speichern"). Notifications surface (e.g. a badge/list reachable from home or a bell) lists pending suggestions for the current user with accept/decline buttons.

## Risks / Trade-offs

- [Attribution of accepted events] → decide whose `who` the created event carries (suggester vs. accepter); default to the suggester, but confirm with users — it changes how the event reads in the calendar.
- [Two SSE notifications on accept] → intentional: suggestions list and calendar both refresh; ensure no duplicate event rows are created (accept must be idempotent: only act when status is still `pending`).
- [Migration must be additive] → `CREATE TABLE IF NOT EXISTS`; no changes to `events`.
- [Notification surface scope] → keep v1 minimal (a list with a count badge); avoid building a general notification system.

## Open Questions

- Accepted-event attribution (suggester vs. accepter) — confirm with the users.
- Where the notifications surface lives (home banner, a bell icon in the header, or within the calendar tab) — pick during implementation to fit the existing nav.
- Whether declined suggestions are kept (history) or deleted — default: keep with `status='declined'` for a short history, no UI to browse them in v1.
