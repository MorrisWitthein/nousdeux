## 1. DB-free unit tests (always run)

- [x] 1.1 Add `TestValidateMovie` to `validate_test.go`: valid movie, over-length title, each invalid `statusType`, matching the existing validator test style
- [x] 1.2 Create `auth_test.go` with `TestRequireAuth` covering: valid `Bearer` token calls next with `userFromContext` populated; valid `?token=` query param works; admin claim makes `isAdminFromContext` true
- [x] 1.3 Extend `TestRequireAuth` rejection cases: missing token, non-JWT string, token signed with a different secret, non-HS256 algorithm, and expired `exp` — each returns `401` and never calls next
- [x] 1.4 Add a helper to mint test tokens against a fixed test `jwtSecret` (valid, expired, wrong-secret, wrong-alg)

## 2. DB test harness

- [x] 2.1 Create `testmain_test.go` with `TestMain` that reads `TEST_DATABASE_URL`; if unset/unreachable, mark DB tests to skip
- [x] 2.2 On a reachable DB, connect a pool and apply embedded migrations to a uniquely-named disposable schema (drop-if-exists on both setup and teardown)
- [x] 2.3 Add a `requireDB(t)` / `newTestApp(t)` helper that returns an `App` wired to the test pool with real brokers, or skips the test when no DB is configured
- [x] 2.4 Document `TEST_DATABASE_URL` usage (README or a comment in the harness) and confirm `go test ./...` passes with it unset (DB tests skip)

## 3. Login tests (DB-gated)

- [x] 3.1 `TestHandleLogin` valid credentials: seed a user, post creds, assert `200` and a token whose parsed `sub` equals the username and validates against the secret
- [x] 3.2 `TestHandleLogin` invalid credentials: unknown username and wrong password both return `401` with an `{"error": ...}` body and no token

## 4. CRUD happy-path tests (DB-gated)

- [x] 4.1 Create `crud_test.go`; pick one representative resource and test `GET` returns `200` with a JSON array
- [x] 4.2 Test `POST` returns `201` with generated `id`/`created_at` and `who` set from an injected auth context; assert the resource's SSE broker receives an event
- [x] 4.3 Test `PATCH` updates an existing row and returns the updated record
- [x] 4.4 Test `DELETE` of an existing row succeeds; `PATCH` and `DELETE` of a non-existent id each return `404` with an `{"error": ...}` body

## 5. Verify

- [x] 5.1 Run `go test ./...` with `TEST_DATABASE_URL` unset — all non-DB tests pass, DB tests skip
- [x] 5.2 Run `go test ./...` against the local `docker compose` Postgres with `TEST_DATABASE_URL` set — full suite passes
- [x] 5.3 Bump `api/VERSION` (patch) and update `TODO.md`: mark Phase 2 done and check off the completed Phase 3 "API — critical" items
