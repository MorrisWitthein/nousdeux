## 1. Baseline

- [x] 1.1 Run `go build ./...`, `go vet ./...`, and `go test ./...` in `api/` and record the green baseline
- [x] 1.2 Confirm the working tree is clean and the feature branch is rebased on `main`

## 2. Response helpers & brokers

- [x] 2.1 Create `api/respond.go` and move `writeJSON` and `writeError` into it verbatim from `middleware.go`
- [x] 2.2 Leave `cors` in `middleware.go`; confirm it still compiles
- [x] 2.3 Create `api/brokers.go` and move the six `*sse.Broker` declarations out of `store.go`, leaving only `pool` in `store.go`
- [x] 2.4 `go build ./...` + `go vet ./...` — confirm green

## 3. Shared CRUD scaffolding

- [x] 3.1 Create `api/crud.go` with `nullIfEmpty` (moved from `handlers.go`)
- [x] 3.2 Add guard helpers `requireID(w, r) (string, bool)` and `decodeBody(w, r, dst, limit) bool` mirroring the existing inline 400 behavior exactly
- [x] 3.3 Add generic `listResource[T any](w, r, query string)` running the GET query → `pgx.CollectRows[T]` → `writeJSON`
- [x] 3.4 Add `deleteResource(w, r, table string, broker *sse.Broker, after func(id string))` reproducing id-required → DELETE → rows-affected → after-hook → notify → respond
- [x] 3.5 `go build ./...` — helpers compile unused (OK at this stage)

## 4. Split handlers per resource

- [x] 4.1 Create `api/events.go`; move `handleEvents`; switch GET to `listResource`, DELETE to `deleteResource` with an `after` that `os.RemoveAll`s the attachments dir
- [x] 4.2 Create `api/recipes.go`; move `handleRecipes`; wire GET/DELETE helpers with `removeRecipeImageFile` as the DELETE `after` hook
- [x] 4.3 Create `api/series.go`; move `handleSeries`; wire GET/DELETE helpers
- [x] 4.4 Create `api/movies.go`; move `handleMovies` (preserve the `genres == nil → []string{}` handling); wire GET/DELETE helpers
- [x] 4.5 Create `api/activities.go`; move `handleActivities`; wire GET/DELETE helpers
- [x] 4.6 Create `api/shopping.go`; move `handleShoppingList` and `handleShoppingHistory` (preserve `created_at ASC` ordering and the `shopping_history` insert)
- [x] 4.7 Apply `requireID`/`decodeBody` guards to the POST/PATCH branches that benefit, leaving per-resource insert/update SQL in place
- [x] 4.8 Delete the now-empty `handlers.go` (or reduce to nothing); keep `handleHealth` — move it to `main.go` or a small `health.go`

## 5. Colocate recipe-image logic

- [x] 5.1 Move `handleRecipeImage` (GET Unsplash search + PATCH store) from the old `handlers.go` into `recipe_images.go`
- [x] 5.2 Confirm `removeRecipeImageFile` and the PATCH cleanup branch still behave identically

## 6. Verify behavior preserved

- [x] 6.1 `go build ./...` + `go vet ./...` — green
- [x] 6.2 `go test ./...` — all existing tests pass with zero/minimal edits; fix any moved-symbol import references
- [x] 6.3 Review `git diff -w` to confirm handler moves are relocations, not behavior changes
- [x] 6.4 Manually spot-check against the `api-contract` spec scenarios (collection GET order, POST 201 + notify, 400 on empty title, 404 on bad id, 405 + Allow header)

## 7. Optional — App struct DI (stretch, separate commit)

- [x] 7.1 Define an `App` struct holding `pool`, the six brokers, and `jwtSecret`
- [x] 7.2 Convert handlers to `App` methods and update route wiring in `main.go`
- [x] 7.3 Update tests to construct an `App`; confirm `go test ./...` green
- [x] 7.4 N/A — section 7 was completed (not time-boxed out)

## 8. Release

- [x] 8.1 Bump `api/VERSION` (patch)
- [ ] 8.2 Commit on the feature branch and open a PR to `main` via `gh` (no direct push to main)
