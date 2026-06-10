# Plan — Refactoring, Quality & Roadmap

Single working plan. Replaces the former `Roadmap.md` and `refactoring.md`.
Work top to bottom; one PR per phase (Phase 1 may be two).

## Phase 0 — Housekeeping

- [x] Update README.md project structure tree (missing many API files, hooks, styles split)
- [x] Update README.md API endpoint table (missing shopping-list, weather, recipe-import, attachments)
- [x] Fix README.md docker-compose description (frontend service is commented out)

## Phase 1 — Frontend refactoring

- [ ] Split `ListsTab.jsx` (999 lines) into `SeriesSubTab` / `MoviesSubTab` / `ActivitiesSubTab` / `ShoppingSubTab`
- [ ] Split `CalendarTab.jsx` (891 lines): extract `<EventForm />` and `useSwipeMonth` hook
- [ ] Move `formatISOToGerman` to `src/utils/date.js`
- [ ] Extract `ProfileModal` from `App.jsx` inline JSX
- [ ] Wrap `useShoppingList` `history` computation in `useMemo`
- [ ] Keyboard & a11y — make interactive `<div onClick>` cards real `<button>`s (stat cards, list items, date chip, calendar days)
- [ ] Disable Save buttons while title is empty (match calendar endDate behaviour)

## Phase 2 — API refactoring

- [ ] Split `handlers.go` (817 lines) into per-resource files / shared CRUD helpers
- [ ] Move response helpers (`writeJSON`, `writeError`) out of `middleware.go`
- [ ] Separate DB pool from SSE brokers in `store.go`
- [ ] Colocate recipe-image logic (split between `handlers.go` and `recipe_images.go`)
- [ ] Optional: wrap global state (`pool`, brokers, `jwtSecret`) in an `App` struct for DI

## Phase 3 — Tests

### API — critical
- [ ] `auth.go` — login (valid/invalid creds), token validation, expired tokens, `requireAuth`
- [ ] `validateMovie` — only Event/Series/Activity/Recipe have validation tests
- [ ] Handler happy paths — existing tests only cover 400s, never successful CRUD

### API — medium
- [ ] `recipe_import.go` — `htmlToText`, `stripMarkdownFences`
- [ ] `recipe_images.go` — upload, serve, delete
- [ ] `sse/broker.go` — notify, serve, shutdown
- [ ] `cleanup.go` — cleanup logic

### Frontend
- [ ] Set up Vitest
- [ ] Unit tests for hooks (mock fetch + SSE)
- [ ] Smoke tests for tab components

## Phase 4 — Features (former roadmap)

In order:

- [ ] **Calendar view refactor** — incorporate the event list into the calendar view; clicking a day switches to a single-day view of that day's events; keep an option to see the next upcoming events. (Builds on the Phase 1 CalendarTab split.)
- [ ] **Visual distinction of tags vs. metadata** — distinguish tags from other metadata visually across all resource types, mirroring today's movie behaviour (platform highlighted differently from genre).
- [ ] **Report a bug** — button in the profile modal opening a prefilled GitHub issue.
- [ ] **Dark mode** — dark palette via CSS variables + toggle in the profile, persisted via settings.
- [ ] **Statistics detail view** — detail view from the home-screen stat cards with in-depth per-resource stats, historic data and visualizations.
- [ ] **Event suggestions** — suggest events that appear as notifications for the other user, accept/decline. Needs DB migration, API endpoints, SSE notification, UI.

## Done (from the old refactoring list)

Dead code removal (ActivitiesTab, mock db, data.js) · `hooks/api.js` extraction ·
`Sheet` component · `authorColor` helper · empty states · loading states ·
undo-toast deletes · `sanitizeFilename` fix · `handleWeather` response helpers ·
normalized hook error handling.
