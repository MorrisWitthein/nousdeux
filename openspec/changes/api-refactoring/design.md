## Context

The `api/` package is a flat, single-package Go HTTP service backed by pgx and a hand-rolled SSE broker. `handlers.go` is 817 lines and holds six near-identical CRUD handlers (`handleEvents`, `handleRecipes`, `handleSeries`, `handleMovies`, `handleActivities`, `handleShoppingList`) plus `handleShoppingHistory`, `handleRecipeImage`, and the `nullIfEmpty` helper. Each CRUD handler repeats the same shape: a `switch r.Method` with GET (query → `pgx.CollectRows` → `writeJSON`), POST (max-bytes → decode → require title → validate → set `who` → insert → log → `broker.Notify()` → respond), PATCH, and DELETE.

State is held in package-level globals: `pool` and six brokers in `store.go`, `jwtSecret`/`users`/`adminUsers` in `auth.go`, `attachmentsDir` in `attachments.go`. Response helpers `writeJSON`/`writeError` live in `middleware.go` next to `cors`. Recipe-image handling is split: the search/store handler is in `handlers.go`, the upload/serve/resize/cleanup is in `recipe_images.go`.

Tests (`handlers_test.go`, `validate_test.go`, etc.) are in the same `package main` and reference these handlers and helpers directly. There is no router framework — routes are wired by hand in `main.go` with `net/http`'s `ServeMux`.

Constraint: this must be a behavior-preserving refactor. The deployment is a tiny Raspberry Pi k8s pod; nothing about the build, image, or runtime characteristics should change.

## Goals / Non-Goals

**Goals:**
- One file per resource, each owning its handler(s), so `handlers.go` disappears or shrinks to nothing meaningful.
- Collapse the four-way CRUD duplication into shared, typed helpers so adding a resource or a test is cheap.
- Put response helpers in a file named for what they do (`respond.go`); leave `middleware.go` for `cors`/auth wrapping.
- `store.go` is about persistence only; SSE brokers live elsewhere.
- Recipe-image search/store logic sits next to the rest of the recipe-image code.
- Keep all existing tests green with minimal edits (import/symbol moves only, not rewrites).

**Non-Goals:**
- No change to routes, request/response bodies, status codes, headers, or ordering.
- No new dependencies, no router library, no change to the SSE protocol.
- No database schema or migration changes.
- No splitting the package into sub-packages (stays `package main`) — this refactor is about file organization, not module boundaries.
- Phase 3 test additions are out of scope here (this change only keeps existing tests passing).

## Decisions

### Decision 1: Per-resource files over a single `handlers.go`
Move each handler into a file named for its resource: `events.go`, `recipes.go`, `series.go`, `movies.go`, `activities.go`, `shopping.go`. `handleShoppingHistory` goes in `shopping.go`; `nullIfEmpty` moves to `respond.go` or a small `helpers.go` since it is used across resources. `handleRecipeImage` moves into `recipe_images.go`.

*Alternative considered:* a `handlers/` sub-package. Rejected — it forces exporting `pool`, brokers, and helpers (or threading them through), which is a larger change than the refactor warrants and conflicts with the "stays `package main`" non-goal.

### Decision 2: Generic CRUD helpers to remove duplication
Introduce typed helpers in a new `crud.go`, parameterized over the resource type and its broker. Sketch:

- `listResource[T any](w, r, query string, broker *sse.Broker)` — runs the GET query, `pgx.CollectRows[T]`, and `writeJSON`. (Broker unused on GET; keep signature minimal — likely `listResource[T any](w, r, query)`.)
- `deleteResource(w, r, table string, broker *sse.Broker, after func(id string))` — shared id-required → `DELETE` → rows-affected → optional `after(id)` cleanup (e.g. event attachments dir, recipe image file) → notify → respond.
- POST/PATCH stay per-resource for now because each has distinct column lists, validation calls, and `RETURNING` clauses; forcing them into a generic shape would need per-resource insert/update closures that obscure more than they save. The win is concentrated in GET and DELETE plus the repeated guard clauses (`id required`, decode-or-400, `title required`), which become small shared helpers (`requireID`, `decodeBody`).

*Alternative considered:* fully generic insert/update via reflection or struct tags. Rejected — too clever for six resources; hurts readability and risks behavior drift.

### Decision 3: `respond.go` for `writeJSON`/`writeError`
Pure move of the two functions out of `middleware.go` into `respond.go`. `middleware.go` keeps `cors` (and conceptually pairs with `auth.go`'s `requireAuth`). No signature changes.

### Decision 4: Split brokers out of `store.go` into `brokers.go`
`store.go` keeps `pool`. The six `*sse.Broker` vars move to `brokers.go`. This is a trivial declaration move; all references are package-level so nothing else changes.

### Decision 5: `App` struct DI is deferred (stretch only)
Wrapping `pool`, brokers, and `jwtSecret` in an `App` struct and converting handlers to methods is genuinely useful for testing but touches every handler signature, every route registration in `main.go`, and every test. Decision: keep it as an explicit, optional final task gated behind the file-split landing cleanly. If time-boxed out, the globals stay — the file reorganization delivers most of the readability/testability value on its own. Doing both in one PR risks a large, hard-to-review diff.

*Alternative considered:* doing the `App` struct first. Rejected — the split is lower-risk and independently valuable; DI on top of an already-split layout is a smaller, cleaner follow-up diff.

## Risks / Trade-offs

- **Behavior drift during mechanical moves** → Verify with `go build ./...`, `go vet ./...`, and the existing `go test ./...` after every file move; the `api-contract` spec scenarios are the acceptance checklist. Move code verbatim before extracting helpers, so any diff in a `git diff -w` review is obviously a relocation.
- **Generic helpers obscure per-resource quirks** (e.g. event DELETE also `os.RemoveAll`s the attachments dir; recipe DELETE calls `removeRecipeImageFile`) → The `deleteResource` helper takes an `after func(id string)` hook so these side effects stay explicit at the call site rather than hidden.
- **Test references break on symbol moves** → Tests are `package main`, so moved symbols remain in-package; only edits needed are if a test imported a now-relocated unexported name (none cross packages). Expect zero or near-zero test edits.
- **`App` struct scope creep** → Explicitly gated as optional/last; if started, it is its own commit so it can be dropped without unwinding the split.
- **Merge conflict surface** → `handlers.go` deletion is large; land this promptly and rebase the feature branch before opening the PR.

## Migration Plan

1. Land the file split + helper extraction in one PR; bump `api/VERSION` (patch).
2. No runtime migration — rebuild the image, redeploy. Rollback is redeploying the previous image tag; no data or schema involved.
3. The optional `App` struct, if pursued, follows as a separate commit/PR on top.

## Open Questions

- Should `nullIfEmpty` and the new guard helpers (`requireID`, `decodeBody`) live in `respond.go`, a dedicated `helpers.go`, or `crud.go`? Leaning `crud.go` for the CRUD-specific guards and leaving `nullIfEmpty` beside them. Resolve during implementation.
- Is the `App` struct in-scope for this PR or deferred? Default: deferred unless the split lands with time to spare.
