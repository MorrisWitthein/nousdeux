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
