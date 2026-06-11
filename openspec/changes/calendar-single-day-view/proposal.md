## Why

The calendar tab currently shows the month grid and, below it, a flat event list. Tapping a day merely filters that same list in place, so the day's events compete for space with the grid and the "what's coming up" overview is lost the moment a day is selected. Users want a focused single-day view when they tap a day, while still being able to fall back to the upcoming-events overview.

## What Changes

- Day cells in the month grid show **event indicators** (coloured dots) for days that have events, so events are visible at a glance — like Google Calendar's month view.
- Tapping a day in the month grid opens a dedicated **single-day view** for that date instead of just filtering the inline list.
- The single-day view shows the selected date prominently (weekday + full date) and lists only that day's events, with the same add/edit/delete/detail affordances.
- A clear way to leave the single-day view and return to the **upcoming events** overview (the default month-relative list of next events).
- The default (no day selected) state keeps showing the upcoming-events list, unchanged in behaviour.
- The month grid stays visible (or easily reachable) in both states so navigation between days remains one tap away.

## Capabilities

### New Capabilities
- `calendar-view`: The calendar tab's view behaviour — month grid navigation with in-cell event indicators, the upcoming-events overview, and the single-day view with switching between them.

### Modified Capabilities
<!-- No existing calendar spec; behaviour is captured as a new capability. -->

## Impact

- Frontend only. Affected files: `src/tabs/CalendarTab.jsx` (view-state and rendering), `src/tabs/calendar/MonthGrid.jsx` (selection affordance), and `src/styles/calendar.js` (single-day view styling).
- No API, DB, or data-layer changes. Event CRUD and attachment flows are reused as-is.
- Bump `package.json` version and add a `CHANGELOG.md` entry (frontend release rules).
