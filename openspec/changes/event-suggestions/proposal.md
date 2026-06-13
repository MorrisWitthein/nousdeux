## Why

Today either user can add an event directly to the shared calendar. There is no lightweight way to *propose* an event for the other person to confirm first ("Wollen wir Freitag ins Kino?"). Event suggestions let one user suggest an event that surfaces as a notification for the other user, who can accept (it becomes a real calendar event) or decline. This adds a collaborative, opt-in step on top of the existing shared calendar.

## What Changes

- A user can create an **event suggestion** (same shape as an event: title, date, optional end date, time, badge) directed at the other user.
- The other user sees suggestions as **notifications** in the app, with **accept** and **decline** actions.
- **Accepting** a suggestion creates a real event in the calendar (attributed appropriately) and marks the suggestion resolved.
- **Declining** marks the suggestion resolved without creating an event.
- Suggestions update **live via SSE**, like the existing resources, so the other user sees a new suggestion without reloading.
- Requires a **DB migration** (new table), **API endpoints** (list/create/accept/decline), an **SSE broker**, and **UI** (a way to suggest, and a notifications surface with accept/decline).

## Capabilities

### New Capabilities
- `event-suggestions`: Proposing calendar events to the other user, who is notified and can accept (creating a real event) or decline.

### Modified Capabilities
<!-- Reuses the existing event/SSE patterns; the suggestion lifecycle is a new capability. -->

## Impact

- **Full-stack.**
- DB: new migration `api/db/migrations/019_event_suggestions.sql` creating an `event_suggestions` table (id, title, date, end_date, time, badge, badge_type, suggested_by, status, created_at, resolved_at).
- API: a new handler file (e.g. `api/event_suggestions.go`) with list/create/accept/decline; accept inserts into `events` reusing existing validation; register the route in the router; add a suggestions SSE broker on the `App` struct (`api/app.go`).
- SSE: new broker + `Notify()` on create/accept/decline; an SSE endpoint mirroring the existing per-resource streams.
- Frontend: a new hook (e.g. `src/hooks/useEventSuggestions.js`) following the `useEvents` pattern (fetch + SSE), a "suggest" affordance (likely in the calendar event form), and a notifications surface with accept/decline. Wire into `App.jsx`.
- Bump **both** `package.json` (frontend) and `api/VERSION` (API), and add a `CHANGELOG.md` entry for the frontend.
