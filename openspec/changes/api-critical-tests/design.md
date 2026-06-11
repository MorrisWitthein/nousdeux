## Context

The API's only tests are `validate_test.go` (pure functions) and the 400-path handler tests in `handlers_test.go`, which run against `testApp := &App{}` — an `App` with a nil `pool`. That works because validation guards reject the request before any DB access. Anything past the guard (login, successful CRUD, broker notification) touches `app.pool`, which is a concrete `*pgxpool.Pool`, not an interface. There is no seam to inject a fake, and the project has no mocking library.

`handleLogin`, `handleChangePassword`, and every CRUD success path call `app.pool.QueryRow` / `Query` / `Exec` directly. `requireAuth`, by contrast, only touches `app.jwtSecret` and the request context — it is DB-free and fully unit-testable today.

Schema lives in `api/db/migrations/*.sql`, embedded via `//go:embed` and applied by `db.Migrate()` on startup. The same migrations can build a disposable test schema.

## Goals / Non-Goals

**Goals:**
- Full coverage of `requireAuth` and `validateMovie` with plain unit tests (no DB).
- Login (valid/invalid) and CRUD happy-path coverage against a real schema.
- `go test ./...` stays green on a machine with no Postgres — DB tests skip, they do not fail.
- Reuse the existing migrations as the test schema source of truth; no second schema definition.

**Non-Goals:**
- Refactoring production code to introduce a DB interface (`Querier`) purely for testability — evaluated below and deferred.
- Frontend tests (Vitest) — that is a separate Phase 3 item.
- Coverage of `recipe_import`, `recipe_images`, `sse`, `cleanup` — separate Phase 3 "medium" items.
- A CI Postgres service — the change makes tests CI-ready (env-gated skip) but wiring the CI job is follow-up.

## Decisions

### Decision: Test DB-dependent code against a real Postgres, gated by `TEST_DATABASE_URL`

Login and CRUD success paths run against a real Postgres reached via a `TEST_DATABASE_URL` env var. A `TestMain` (in `testmain_test.go`) reads it once: if unset/unreachable, a package-level flag marks DB tests to `t.Skip`; if set, it connects a pool, runs the embedded migrations against a uniquely-named disposable schema (or a throwaway database), and tears it down at the end. Each DB test calls a `requireDB(t)` helper that skips when no pool is available.

**Why over alternatives:**
- *pgxmock / sqlmock*: would let tests run with zero infrastructure, but asserts against hand-written SQL strings — brittle, and it tests "did we send this query" not "does the query work against the schema." Given the CRUD layer is thin SQL, a real DB gives far more signal.
- *testcontainers-go*: spins up Postgres automatically per run — best DX, but adds a heavy dependency and requires Docker in CI, conflicting with the Raspberry Pi / minimal-footprint constraint. `TEST_DATABASE_URL` against the existing `docker compose` Postgres (already used for local dev) is lighter and matches how the project is run today.
- *Refactor `App.pool` to a `Querier` interface*: cleanest long-term seam, but a production code change motivated only by tests, touching every handler. Deferred to keep this change test-only and low-risk.

### Decision: Split tests by what they need, not by file

- `requireAuth` and `validateMovie` → no DB, run always. Put `requireAuth` cases in `auth_test.go`, add `TestValidateMovie` to `validate_test.go`.
- `handleLogin` and CRUD round-trips → DB-gated, in `auth_test.go` and a new `crud_test.go`, each starting with `requireDB(t)`.

This keeps the always-on suite meaningful even without a database — `requireAuth` (the highest-risk auth surface) and all validators run unconditionally.

### Decision: Drive handlers through their public method signatures

Tests build an `App` (real pool for DB tests; `&App{jwtSecret: ...}` for `requireAuth`) and call `app.handleEvents` / `app.requireAuth` via `httptest`, exactly as `handlers_test.go` already does. Auth context is injected with `context.WithValue(ctx, userKey, "max")` so the `who` field and `userFromContext` are exercised without a full login round-trip in every CRUD test.

### Decision: Assert broker notification via a subscriber

For the POST happy path, subscribe to the resource's `*sse.Broker` before the call and assert an event arrives (with a short timeout), proving the create path notifies subscribers as the spec requires.

## Risks / Trade-offs

- **DB tests are skipped by default locally** → a developer may not notice they broke a CRUD path. Mitigation: document `TEST_DATABASE_URL` in the API README/test helper, and make CI set it so the full suite runs on every PR.
- **Disposable schema/database cleanup leaks on a hard crash** → use a uniquely-named schema per run and `DROP ... IF EXISTS` at startup as well as teardown, so a stale schema from a killed run is reclaimed.
- **Real-DB tests are slower than mocks** → acceptable; the always-on unit suite stays fast, and the DB subset is small (one representative resource, not all six).
- **Testing only one resource's CRUD** → the per-resource handlers share `crud.go` helpers, so one representative resource covers the shared machinery; the others differ only in column lists already guarded by validation tests.

## Migration Plan

Additive and test-only. No production code, schema, or runtime behavior changes. No rollback concerns — reverting is deleting the new test files. CI gains a Postgres service and `TEST_DATABASE_URL` as a follow-up; until then the DB subset skips and the rest runs.

## Open Questions

- Disposable **schema** (search_path) vs. throwaway **database** for isolation — leaning schema-per-run for speed; settle during implementation.
- Whether to also add a single end-to-end login→authenticated-request test once both halves exist (nice-to-have, not required by the spec).
