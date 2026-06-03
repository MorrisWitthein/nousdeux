# TODO — Refactoring & Quality

## Dead Code Removal

- [ ] Delete `src/tabs/ActivitiesTab.jsx` — unused, activities lives in ListsTab
- [ ] Delete `src/mock/db.js` — nothing imports it
- [ ] Delete `src/data.js` — nothing imports it (mock layer is dead)

## Frontend Refactoring

### High Priority

- [ ] Extract `authHeaders()`, `handleUnauth()`, `API` constant to `src/hooks/api.js` — duplicated across all 6 hooks (~70 lines of copy-paste)
- [ ] Extract `Sheet` component to `src/components/Sheet.jsx` — defined identically in CalendarTab, RecipesTab, ListsTab
- [ ] Split `ListsTab.jsx` (781 lines) into per-sub-tab components: `SeriesSubTab`, `MoviesSubTab`, `ActivitiesSubTab`, `ShoppingSubTab`
- [ ] Split `CalendarTab.jsx` (790 lines) — extract `<EventForm />` and `useSwipeMonth` hook

### Medium Priority

- [ ] Normalize hook error handling — `useEvents` throws on failure, all others silently swallow. Pick one approach.
- [ ] Wrap `useShoppingList` `history` computation in `useMemo`
- [ ] Extract `ProfileModal` from `App.jsx` inline JSX (55 lines)
- [ ] Extract shared `formatISOToGerman` to `src/utils/date.js` (duplicated in CalendarTab + ActivitiesTab)

## API Refactoring

### High Priority

- [ ] Split `handlers.go` (787 lines) into per-resource files or extract shared CRUD helpers to reduce boilerplate
- [ ] Fix `handleWeather` to use `writeError()`/`writeJSON()` instead of `http.Error()` + manual JSON encoding
- [ ] Fix `sanitizeFilename("")` returning `"."` — should reject empty filenames (`attachments.go:202`)

### Medium Priority

- [ ] Colocate all recipe-image logic (currently split between `handlers.go:598-682` and `recipe_images.go`)
- [ ] Rename/split `middleware.go` — contains response helpers (`writeJSON`, `writeError`) that aren't middleware
- [ ] Separate DB pool from SSE brokers in `store.go`

### Low Priority (Testability)

- [ ] Wrap global state (`pool`, brokers, `jwtSecret`) in an `App` struct for dependency injection

## Missing Tests

### API — Critical

- [ ] `auth.go` — login (valid/invalid creds), token validation, expired tokens, `requireAuth` middleware
- [ ] `validateMovie` — only Event/Series/Activity/Recipe have validation tests
- [ ] Handler happy paths — existing tests only verify 400 on bad input, never test successful CRUD

### API — Medium

- [ ] `recipe_import.go` — `htmlToText`, `stripMarkdownFences` (pure functions, easy to test)
- [ ] `recipe_images.go` — upload, serve, delete
- [ ] `sse/broker.go` — notify, serve, shutdown
- [ ] `cleanup.go` — cleanup logic

### Frontend

- [ ] Set up test framework (Vitest) — no test infrastructure exists
- [ ] Add smoke tests for tab components
- [ ] Add unit tests for hooks (mocking fetch + SSE)

## Documentation

- [ ] Update README.md project structure tree (missing many API files, hooks, styles split)
- [ ] Update README.md API endpoint table (missing shopping-list, weather, recipe-import, attachments)
- [ ] Fix README.md docker-compose description (frontend service is commented out)

## Frontend Usability

Findings from a usability review of the four tabs, shared components, and styling.

### High Priority

- [x] Add empty states everywhere except the shopping list (which already has one at `ListsTab.jsx:846`). A new couple sees blank tabs with just a floating `+`. Cover: Calendar with no events; tapping a calendar day with no events (currently shows nothing, looks broken — `CalendarTab.jsx:691`); Series / Movies / Activities with no items; Recipes with no items.
- [x] Add a loading state on initial fetch — hooks load async but tabs render their empty layout immediately. Home shows `0` Events / `0` Serien during the fetch (`HomeTab.jsx:206-227`), i.e. confidently wrong numbers. Use a skeleton or `–` until first load.
- [x] Replace `window.confirm` deletes with an undo toast — every delete uses native `window.confirm` (e.g. `CalendarTab.jsx:835`, `ListsTab.jsx:344`). Breaks the PWA look, and in a shared app a partner's accidental delete is unrecoverable. Use the existing `ToastContext` for a "Gelöscht · Rückgängig" toast. (Record deletes — events, series, movies, activities, recipes — now delete immediately with a "Rückgängig" undo toast. Attachment delete keeps its confirm since the file blob can't be restored.)
- [ ] Fix the header avatar, hardcoded `avatar-b` (teal) for both users (`App.jsx:69`), which contradicts the scheme everywhere else.

### Medium Priority

- [ ] Standardize the add/edit pattern across tabs — Recipes uses a slide-up `Sheet`; Calendar and Lists render an inline `.add-form` at the top while the FAB is bottom-right, compensating with `window.scrollBy` (`CalendarTab.jsx:452`, `ListsTab.jsx:173`). Standardize on the bottom `Sheet` (also gets swipe-to-dismiss for free).
- [ ] Make the profile modal reuse `Sheet` — hand-rolled with inline styles and its own backdrop (`App.jsx:125-210`), losing swipe-to-dismiss and duplicating ~80 lines of styling. (Overlaps with the "Extract `ProfileModal`" refactoring item above.)
- [ ] Stop the greeting re-randomizing on every render — `rnd()` runs during render in `HomeTab` (lines 142-151), so any re-render reshuffles the greeting/emoji/special-day label. Wrap in `useMemo` (or a `useState` initializer) so it's stable for the session.
- [ ] Check FAB overlap with content — FAB is fixed at `bottom: 100px` (`nav.js:5`) over content with `padding-bottom: 160px` (`layout.js:86`). On Calendar/Lists it floats over the last card and the "Mehr anzeigen" button. Verify on a real device with a full list.

### Low Priority / Polish

- [ ] Keyboard & a11y — interactive cards are `<div onClick>` (stat cards, list items, date chip, calendar days), with no focus ring, `role`, or keyboard activation. Better as `<button>`.
- [ ] Calendar day-tap discoverability — tapping a day filters the list below with no visual cue that scope changed or how to clear it (clear-on-tap-empty handled at `CalendarTab.jsx:493` but invisible).
- [ ] Save buttons stay enabled while title is empty (validation fires only on submit) — inconsistent with the calendar's endDate, which disables Save.

**Suggested starting point:** empty states and the undo-on-delete toast — self-contained, high-value, and the biggest improvements to day-one and shared use.
