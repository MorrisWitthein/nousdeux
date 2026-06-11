## ADDED Requirements

### Requirement: Authentication paths are covered by tests

The API's authentication code SHALL have automated tests covering login outcomes, JWT validation, and the admin claim, so that a regression in credential checking or token handling fails the build.

#### Scenario: Login with valid credentials issues a token

- **WHEN** a test posts valid credentials to `handleLogin`
- **THEN** the response is `200` and the body contains a non-empty `token` that parses and validates against the app's JWT secret with a `sub` claim equal to the username

#### Scenario: Login with invalid credentials is rejected

- **WHEN** a test posts an unknown username or a wrong password to `handleLogin`
- **THEN** the response is `401` with an `{"error": ...}` body and no token, and the two cases are indistinguishable to the client

#### Scenario: requireAuth accepts a valid token and populates context

- **WHEN** a request carries a valid `Bearer` token (and, separately, a valid `?token=` query parameter)
- **THEN** `requireAuth` calls the wrapped handler with the username available via `userFromContext`, and an `admin` claim makes `isAdminFromContext` return true

#### Scenario: requireAuth rejects missing, malformed, expired, and wrong-signature tokens

- **WHEN** a request has no token, a non-JWT string, a token signed with a different secret, a token using a non-HS256 algorithm, or a token whose `exp` is in the past
- **THEN** `requireAuth` responds `401` with an `{"error": ...}` body and never calls the wrapped handler

### Requirement: All resource validators are covered by tests

Every `validate*` function SHALL have a table-driven unit test exercising its valid and invalid branches, with no validator left untested.

#### Scenario: validateMovie has a unit test

- **WHEN** the test suite runs
- **THEN** `validateMovie` is exercised with a valid movie (passes), an over-length title (rejected), and each invalid `statusType` branch (rejected with the documented message)

### Requirement: CRUD happy paths are covered by tests

Handler tests SHALL cover at least one successful round-trip per HTTP method for a representative resource, not only the `400` rejection paths, so that a regression in a successful create/read/update/delete fails the build.

#### Scenario: Successful GET, POST, PATCH, DELETE round-trip

- **WHEN** a test drives a representative resource handler against a real schema with a valid body
- **THEN** `GET` returns `200` with a JSON array, `POST` returns `201` with the created record (generated `id`, `created_at`, and `who` from auth context), `PATCH` returns the updated record, and `DELETE` returns success — and the resource's SSE broker is notified on create

#### Scenario: Update or delete of a missing id reports not-found

- **WHEN** a test `PATCH`es or `DELETE`s a syntactically valid id that matches no row
- **THEN** the response is `404` with an `{"error": ...}` body

### Requirement: Database-dependent tests skip cleanly without a database

Tests that require a real database SHALL skip rather than fail when no database is configured, so that `go test ./...` passes on a machine or CI job without Postgres while still running fully when a database is available.

#### Scenario: No database configured

- **WHEN** the test run has no database connection string configured
- **THEN** DB-dependent tests call `t.Skip` with an explanatory message and the overall `go test ./...` run still succeeds

#### Scenario: Database available

- **WHEN** a database connection string is configured and reachable
- **THEN** DB-dependent tests connect, run migrations against a disposable schema, execute, and clean up after themselves
