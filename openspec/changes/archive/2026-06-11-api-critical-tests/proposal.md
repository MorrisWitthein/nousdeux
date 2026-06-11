## Why

The Go API has tests for validation only. The critical paths — authentication and successful CRUD — are completely untested. `auth.go` (login, token validation, `requireAuth`, password change) has zero coverage, `validateMovie` is the only validator without a unit test, and every handler test only exercises 400 rejection paths, never a successful 2xx round-trip. A regression in login or a CRUD happy path would ship silently.

## What Changes

- Add unit tests for `auth.go`: login with valid/invalid credentials, JWT validation via `requireAuth` (missing/malformed/expired/wrong-signature tokens, header vs. `?token=` query param), and the admin claim being threaded into the request context.
- Add a `TestValidateMovie` table test, matching the existing `validateEvent`/`validateSeries`/`validateActivity`/`validateRecipe` tests.
- Add handler happy-path tests: a successful `GET` (list), `POST` (201 + created body + broker notify), `PATCH`, and `DELETE` for at least one representative resource, plus `404` on update/delete of a missing id.
- Introduce a database-backed test harness so handler and login tests can run against a real schema without a hand-rolled mock. Tests that require a DB skip cleanly when one is unavailable, so `go test ./...` still passes on a machine without Postgres.

## Capabilities

### New Capabilities
- `api-test-coverage`: Defines the minimum automated-test coverage the API guarantees for its critical paths — authentication, input validation, and CRUD happy paths — and how DB-dependent tests behave when no database is present.

### Modified Capabilities
<!-- None: this change adds tests and a test harness; it does not alter the HTTP contract defined in api-contract. -->

## Impact

- **New test files** under `api/`: `auth_test.go`, additions to `validate_test.go` and `handlers_test.go` (or a new `crud_test.go`), and a shared test helper (e.g. `testmain_test.go`) for DB setup/skip.
- **`api/go.mod`** — may add a test-only dependency for DB-backed tests (real `pgxpool` against a disposable Postgres, gated by an env var); no production dependency changes.
- **CI** — test job must provide (or be allowed to skip) a Postgres instance for the DB-backed subset.
- No production code behavior changes; `App`/handler signatures are exercised as-is.
