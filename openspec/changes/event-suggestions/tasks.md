## 1. Database

- [ ] 1.1 Add migration `api/db/migrations/019_event_suggestions.sql` creating `event_suggestions` (id, title, date, end_date, time, badge, badge_type, suggested_by, status default 'pending', created_at, resolved_at) with `CREATE TABLE IF NOT EXISTS`
- [ ] 1.2 Restart the API locally to confirm the migration applies cleanly

## 2. API — model & handlers

- [ ] 2.1 Add an `EventSuggestion` model in `api/models.go`
- [ ] 2.2 Create `api/event_suggestions.go` with: list (pending suggestions for the current user, i.e. `suggested_by != currentUser`), create (validate with `validateEvent`, insert with `suggested_by = currentUser`), accept, decline
- [ ] 2.3 Accept: only when status is still `pending` (idempotent); insert into `events` reusing the events insert path/validation, set suggestion `status='accepted'`, `resolved_at=now`
- [ ] 2.4 Decline: set `status='declined'`, `resolved_at=now`
- [ ] 2.5 Register the routes in the router

## 3. API — SSE

- [ ] 3.1 Add a `suggestionsBroker` to the `App` struct in `api/app.go` and initialise it like the other brokers
- [ ] 3.2 Add the suggestions SSE stream endpoint mirroring the existing per-resource streams
- [ ] 3.3 Call `suggestionsBroker.Notify()` on create/accept/decline; on accept also call `eventsBroker.Notify()`

## 4. API — tests

- [ ] 4.1 Tests for create (validation, attribution), accept (creates exactly one event, idempotent on re-accept), decline, and the per-user list filter

## 5. Frontend — data

- [ ] 5.1 Add `src/hooks/useEventSuggestions.js` following the `useEvents` pattern (fetch `/api/event-suggestions` + subscribe via `connectStream`), exposing create/accept/decline
- [ ] 5.2 Wire the hook into `App.jsx`

## 6. Frontend — UI

- [ ] 6.1 Add a "suggest" affordance in the calendar event form (e.g. a "Vorschlagen" action alongside "Speichern")
- [ ] 6.2 Add a notifications surface that lists pending suggestions for the current user with accept/decline buttons and a count indicator
- [ ] 6.3 On accept, the new event appears on the calendar live; on accept/decline the suggestion leaves the notifications list

## 7. Verification

- [ ] 7.1 Verify user A suggests an event and user B sees it as a live notification without reloading
- [ ] 7.2 Verify accept creates exactly one calendar event and removes the suggestion; decline removes it without creating an event
- [ ] 7.3 Verify a user does not see their own suggestions in their notifications

## 8. Release bookkeeping

- [ ] 8.1 Bump `api/VERSION` (API change)
- [ ] 8.2 Bump `package.json` `version` (minor) and add a `CHANGELOG.md` section for the frontend release
