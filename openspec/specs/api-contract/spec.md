# api-contract

## Purpose

Defines the observable HTTP contract of the Go API: the routes, methods, request and response shapes, status codes, and shared response conventions that clients depend on. This contract is independent of the internal file layout of the API code.

## Requirements

### Requirement: Resource endpoints preserve their HTTP contract

The API SHALL expose the same routes, methods, request bodies, response bodies, and status codes after the refactor as before it. Splitting `handlers.go` into per-resource files and extracting shared CRUD helpers MUST NOT alter observable HTTP behavior for any of the six resources (`events`, `recipes`, `series`, `movies`, `activities`, `shopping`).

#### Scenario: Collection GET returns the existing list shape

- **WHEN** an authenticated client sends `GET` to a resource collection endpoint (e.g. `/api/events`)
- **THEN** the response is `200` with a JSON array of that resource ordered exactly as before the refactor (events/recipes/series/movies/activities by `created_at DESC`, shopping by `created_at ASC`)

#### Scenario: POST creates and notifies subscribers

- **WHEN** an authenticated client `POST`s a valid resource body
- **THEN** the response is `201` with the created record including its generated `id` and `created_at`, the `who` field is set from the auth context, and the resource's SSE broker is notified

#### Scenario: Missing required field is rejected

- **WHEN** a client `POST`s or `PATCH`es a resource with an empty required field (`title`, or `name` for shopping)
- **THEN** the response is `400` with an `{"error": ...}` body and no database write occurs

#### Scenario: PATCH and DELETE require an id and report not-found

- **WHEN** a client `PATCH`es or `DELETE`s without an `id` query parameter
- **THEN** the response is `400`
- **WHEN** the `id` is present but matches no row
- **THEN** the response is `404` with an `{"error": ...}` body

#### Scenario: Unsupported method is rejected with Allow header

- **WHEN** a client uses an HTTP method a handler does not support
- **THEN** the response is `405` and includes an `Allow` header listing the permitted methods

### Requirement: Shared helpers and response format remain stable

The extracted response helpers (`writeJSON`, `writeError`) and the generic CRUD scaffolding SHALL produce byte-identical response envelopes to the pre-refactor implementation, regardless of which file they now live in.

#### Scenario: Error responses keep the error envelope

- **WHEN** any handler returns an error at any status code
- **THEN** the body is a JSON object of the form `{"error": "<message>"}` with `Content-Type: application/json`

#### Scenario: Recipe-image and list-image side effects are unchanged

- **WHEN** a recipe is deleted or its image URL is replaced
- **THEN** the previously uploaded recipe image file is removed exactly as before, now via colocated logic in `recipe_images.go`
