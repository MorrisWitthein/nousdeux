## Why

The Go API has grown organically and now concentrates most of its logic in a single 817-line `handlers.go` that mixes six unrelated resources, while shared concerns (response helpers, DB pool, SSE brokers, recipe-image logic) are scattered across files in ways that no longer match their responsibilities. This makes the API harder to navigate, test, and extend — and Phase 3 testing work depends on a cleaner seam between handlers and their collaborators. This change is a structural refactor only: no HTTP behavior, routes, or responses change.

## What Changes

- Split `handlers.go` (817 lines) into per-resource files (`events.go`, `recipes.go`, `series.go`, `movies.go`, `activities.go`, `shopping.go`), extracting the repeated CRUD scaffolding (decode → validate → mutate → notify → respond) into shared generic helpers.
- Move response helpers (`writeJSON`, `writeError`) out of `middleware.go` into a dedicated `respond.go`, leaving `middleware.go` for CORS/auth wrapping only.
- Separate the DB pool from the SSE brokers in `store.go` — brokers move to a `brokers.go` (or are owned by the new `App` struct), so `store.go` is solely about persistence.
- Colocate recipe-image logic: the `handleRecipeImage` GET/PATCH handler currently in `handlers.go` moves alongside the upload/serve/resize code in `recipe_images.go`.
- **Optional / stretch**: introduce an `App` struct holding `pool`, the brokers, and `jwtSecret`, converting handlers to methods for dependency injection and removing package-level mutable globals.
- No endpoint, request, or response shape changes. The refactor is verified by `go build` + `go vet` + the existing test suite continuing to pass.

## Capabilities

### New Capabilities
- `api-contract`: Codifies the HTTP behavior that this refactor must preserve unchanged — the invariant that turns a structural reorganization into a verifiable one (same routes, methods, request/response shapes, and status codes before and after).

### Modified Capabilities
<!-- None. HTTP contract (routes, methods, request/response bodies, status codes) is unchanged by this change. -->

## Impact

- **Code (all under `api/`)**: `handlers.go` (removed/split), new `events.go` / `recipes.go` / `series.go` / `movies.go` / `activities.go` / `shopping.go` / `respond.go` / `brokers.go`, modified `middleware.go`, `store.go`, `recipe_images.go`, `main.go` (route wiring, and method receivers if the `App` struct is adopted).
- **Tests**: existing `handlers_test.go`, `validate_test.go`, `attachments_test.go`, `weather_test.go` must keep passing; references to moved symbols may need import/receiver updates.
- **APIs / contracts**: none — fully backward compatible.
- **Dependencies**: none added or removed.
- **Versioning**: bump `api/VERSION` (patch) since files under `api/` change.
- **Deployment**: no migration, no config change; standard image rebuild.
