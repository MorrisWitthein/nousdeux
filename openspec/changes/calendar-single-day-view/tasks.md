## 0. In-cell event indicators

- [ ] 0.1 In `CalendarTab.jsx`, derive a `getEventsForDay` callback (memoised with `useCallback`) that takes a `dateISO` string and returns the events for that date from the full event list, respecting multi-day spans
- [ ] 0.2 Pass `getEventsForDay` as a prop to `MonthGrid`
- [ ] 0.3 In `MonthGrid.jsx`, for each day cell call `getEventsForDay(dateISO)` and collect the unique set of authors (`created_by` / `author` field) with events on that day
- [ ] 0.4 Render author-coloured dots inside each day cell that has events: one dot per unique author, using `--accent` for L and `--accent2` for M
- [ ] 0.5 Add `.day-event-dots` and `.day-event-dot` classes to `src/styles/calendar.js` (5–6 px circles, flex row, centred below the day number)

## 1. Date helpers

- [ ] 1.1 Ensure `src/utils/date.js` exposes weekday names and a full-date formatter for the single-day header (add a `formatISOToGermanLong` or reuse `MONTH_NAMES` + `DAY_ABBR`/full day names as needed)

## 2. Single-day view rendering

- [ ] 2.1 In `CalendarTab.jsx`, branch the section below the month grid: when `selectedDay` is null render the upcoming-events overview (current behaviour); when set render the single-day view
- [ ] 2.2 Add the single-day header showing the selected weekday and full date for `selectedDayISO`
- [ ] 2.3 Add a "Zurück zur Übersicht" back control (a `<button>`) that calls `setSelectedDay(null)`
- [ ] 2.4 Reuse the existing event-card loop for both states; keep edit/delete/detail and the date-prefilled add-FAB working in the single-day view
- [ ] 2.5 Show the day-specific empty state in the single-day view and the month empty state in the overview

## 3. Styling

- [ ] 3.1 Add single-day header and back-control classes to `src/styles/calendar.js`, matching the existing design tokens (fonts, `--ink`/`--muted`, spacing)

## 4. Behaviour verification

- [ ] 4.1 Verify tapping a day opens the single-day view; re-tapping the day and the back control both return to the overview
- [ ] 4.2 Verify month navigation (‹ / › / Heute) clears the selection and shows the new month's overview
- [ ] 4.3 Verify multi-day events appear on every spanned day in the single-day view
- [ ] 4.4 Confirm the outside-click-to-deselect handler still works and does not swallow the new back control
- [ ] 4.5 Verify event dots appear in day cells for days with events and are absent for empty days
- [ ] 4.6 Verify dot colours match author: `--accent` for L events, `--accent2` for M events, both dots when a day has events from both

## 5. Release bookkeeping

- [ ] 5.1 Bump `package.json` `version` (minor) and add a `CHANGELOG.md` section for the release
