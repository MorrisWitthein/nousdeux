## 1. Database

- [x] 1.1 Add migration `api/db/migrations/019_event_suggestions.sql` creating `event_suggestions` (id, title, date, end_date, time, badge, badge_type, suggested_by, status default 'pending', created_at, resolved_at) with `CREATE TABLE IF NOT EXISTS`
- [x] 1.2 Restart the API locally to confirm the migration applies cleanly

## 2. API — model & handlers

- [x] 2.1 Add an `EventSuggestion` model in `api/models.go`
- [x] 2.2 Create `api/event_suggestions.go` with: list (pending suggestions for the current user, i.e. `suggested_by != currentUser`), create (validate with `validateEvent`, insert with `suggested_by = currentUser`), accept, decline
- [x] 2.3 Accept: only when status is still `pending` (idempotent); insert into `events` reusing the events insert path/validation, set suggestion `status='accepted'`, `resolved_at=now`
- [x] 2.4 Decline: set `status='declined'`, `resolved_at=now`
- [x] 2.5 Register the routes in the router

## 3. API — SSE

- [x] 3.1 Add a `suggestionsBroker` to the `App` struct in `api/app.go` and initialise it like the other brokers
- [x] 3.2 Add the suggestions SSE stream endpoint mirroring the existing per-resource streams
- [x] 3.3 Call `suggestionsBroker.Notify()` on create/accept/decline; on accept also call `eventsBroker.Notify()`

## 4. API — tests

- [x] 4.1 Tests for create (validation, attribution), accept (creates exactly one event, idempotent on re-accept), decline, and the per-user list filter

## 5. Frontend — data

- [x] 5.1 Add `src/hooks/useEventSuggestions.js` following the `useEvents` pattern (fetch `/api/event-suggestions` + subscribe via `connectStream`), exposing create/accept/decline
- [x] 5.2 Wire the hook into `App.jsx`

## 6. Frontend — UI

- [x] 6.1 Add a "suggest" affordance in the calendar event form (e.g. a "Vorschlagen" action alongside "Speichern")
- [x] 6.2 Add a notifications surface that lists pending suggestions for the current user with accept/decline buttons and a count indicator
- [x] 6.3 On accept, the new event appears on the calendar live; on accept/decline the suggestion leaves the notifications list

## 7. Verification

- [x] 7.1 Verify user A suggests an event and user B sees it as a live notification without reloading
- [x] 7.2 Verify accept creates exactly one calendar event and removes the suggestion; decline removes it without creating an event
- [x] 7.3 Verify a user does not see their own suggestions in their notifications

## 9. Enhancements — checkbox, counter-proposals, sent tracking

- [x] 9.1 Migration `020_suggestion_negotiation.sql`: add `awaiting` (recipient/sender role) and `last_proposed_by`
- [x] 9.2 API: turn-aware accept/decline; new `counter` endpoint that flips `awaiting` and updates the proposed date/time
- [x] 9.3 API: GET returns `{received, sent}` so one request drives both the action queue and sent-status tracking
- [x] 9.4 API tests: counter bounces back and accepts with countered values; wrong-turn counter rejected; received/sent split
- [x] 9.5 Frontend: replace the "suggest" button with an "Als Vorschlag senden" checkbox in the event form
- [x] 9.6 Frontend: SuggestionsSheet gets "Erhalten"/"Gesendet" tabs and an inline counter-propose form
- [x] 9.7 Bump versions (api 0.18.0, frontend 0.21.0) + changelog

## 8. Release bookkeeping

- [x] 8.1 Bump `api/VERSION` (API change)
- [x] 8.2 Bump `package.json` `version` (minor) and add a `CHANGELOG.md` section for the frontend release
