## Why

The recipe-import path (`api/recipe_import.go`) has two pure parsing helpers — `htmlToText` and `stripMarkdownFences` — that transform untrusted external input (fetched web pages, LLM responses) before it reaches the rest of the pipeline. They are currently untested, so a regression in HTML stripping or fence trimming would pass the build silently. This is the next unchecked item in the Phase 3 "API — medium" test list.

## What Changes

- Add a `recipe_import_test.go` with table-driven unit tests for `htmlToText` (text extraction, skip-tag handling, whitespace trimming, empty input).
- Add table-driven unit tests for `stripMarkdownFences` (fenced JSON with language hint, bare fences, no fences, surrounding prose, trailing whitespace).
- No production code changes — tests only. Both functions are pure and need no database, so tests run unconditionally with `go test ./...`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `api-test-coverage`: Add a requirement that the recipe-import parsing helpers (`htmlToText`, `stripMarkdownFences`) are covered by table-driven unit tests exercising their main branches.

## Impact

- New file: `api/recipe_import_test.go`.
- No changes to `api/recipe_import.go` or any runtime behavior.
- Bump `api/VERSION` (touches `api/`).
