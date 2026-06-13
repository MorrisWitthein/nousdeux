## Context

`CalendarTab.jsx` already owns all calendar state (year/month, `selectedDay`, form state) and already computes `visibleEvents` in two modes: a day-filtered list when `selectedDay` is set, and a month-relative upcoming list otherwise (`CalendarTab.jsx:160-174`). Today both modes render the *same* card list directly under the month grid — selecting a day only swaps the filter and tweaks the empty state. There is no distinct, focused single-day presentation and no explicit "back to upcoming" control (selection is cleared only by re-tapping the day, navigating months, or an outside click).

The change is purely presentational and stays within the existing component. No new data, hooks, or routing are introduced.

## Goals / Non-Goals

**Goals:**
- Event indicators (coloured dots) visible inside each day cell of the month grid — at a glance, users can see which days have events without tapping.
- A visually distinct single-day view: prominent weekday + full date header for the selected day, then that day's events.
- An explicit affordance to return to the upcoming-events overview.
- Preserve all existing affordances (add prefilled with the day, edit, delete + undo toast, detail sheet, attachments) in both states.
- Keep the month grid reachable so day-to-day navigation stays one tap away.

**Non-Goals:**
- No React Router / URL-driven routing — selection stays in component state.
- No change to event filtering semantics (multi-day spanning, sort order) beyond what already exists.
- No API, DB, or data-layer changes.
- No full-screen takeover that hides the grid; the grid remains visible.

## Decisions

**Decision: Drive the view from the existing `selectedDay` state, add a derived `view` distinction rather than new top-level state.**
`selectedDay === null` → upcoming overview; `selectedDay !== null` → single-day view. No new state variable is required for the view toggle, which avoids state that can drift out of sync with `selectedDay`. Month navigation and the outside-click handler already null `selectedDay`, so they correctly return to the overview for free.
- *Alternative considered:* a separate `mode` enum. Rejected — redundant with `selectedDay` and a second source of truth to keep consistent.

**Decision: Render a dedicated single-day header block when a day is selected.**
Show weekday + full German date (reuse/extend `formatISOToGerman` / `MONTH_NAMES` / day names in `utils/date.js`) plus a "Zurück zur Übersicht" / close control that calls `setSelectedDay(null)`. The event-card rendering loop is shared between both states — only the surrounding header and empty-state copy differ.
- *Alternative considered:* a separate `SingleDayView` child component. Reasonable, but the event list, add-FAB, edit/delete handlers, and detail/forms all live in `CalendarTab` and are shared; extracting now would mean threading many props. Keep it inline for this change; revisit extraction if the file grows.

**Decision: Keep the month grid visible above both views.**
The single-day view is a section *below* the grid, not a replacement screen. This keeps the carousel and "Heute" button available and matches the current layout's mental model.

**Decision: Styling lives in `src/styles/calendar.js`.**
Add classes for the single-day header and back control alongside the existing calendar CSS, consistent with the project's single-stylesheet-per-area convention.

**Decision: In-cell event indicators are coloured dots (not chips/text) per day cell.**
Mobile day cells are ~40px wide; full text labels overflow. Small dots (5–6 px, `border-radius: 50%`) use the existing `--accent` (Lena/red) and `--accent2` (Max/teal) for author-coloured events. A day with both authors gets both colours; if the same author has multiple events, one dot per author is shown (max 2 dots). This avoids clutter while preserving the per-author colour language already used throughout the app.
- *Alternative considered:* mini text chips like Google Calendar desktop. Rejected — too narrow on mobile, too much reflow risk.
- *Alternative considered:* a single neutral dot regardless of author. Rejected — loses the at-a-glance "whose day is this?" signal.

**Decision: Pass events to `MonthGrid` via a `getEventsForDay(dateISO)` callback prop.**
`CalendarTab` already holds the full event list. Rather than duplicating state, pass a memoised lookup function so `MonthGrid` stays a pure presentational component and can be tested independently. The function is derived from `visibleEvents` (all events in the displayed month) to match existing filtering semantics.

## Risks / Trade-offs

- [Outside-click handler may swallow the new back control] → ensure the back button matches the handler's ignore selector (`button` is already ignored in `CalendarTab.jsx:84-85`), so a `<button>` back control is safe.
- [`CalendarTab.jsx` grows] → mitigated by reusing the existing event-card loop and not duplicating handlers; if it exceeds a comfortable size, extract `SingleDayView` in a follow-up (noted as non-goal here).
- [Selected-day date math already handles multi-day spans] → reuse the existing `selectedDayISO` filter (`CalendarTab.jsx:163-168`) verbatim to avoid regressions.

## Open Questions

- Exact wording of the back control ("Zurück zur Übersicht" vs. an icon-only close) — minor copy choice, resolve during implementation to match existing German UI tone.
