## Context

`api/recipe_import.go` contains two pure helpers used before LLM extraction:
- `htmlToText(io.Reader)` — walks a parsed HTML tree (`golang.org/x/net/html`), skips noise tags (`htmlSkipTags`), and emits each non-empty trimmed text node on its own line.
- `stripMarkdownFences(string)` — removes a ```` ``` ```` fenced block's opening fence line and closing fence so the inner JSON can be unmarshaled.

Both are deterministic, dependency-free, and currently untested. The existing test suite (`validate_test.go`, `crud_test.go`, etc.) already establishes the table-driven style and the DB-skip convention via `testmain_test.go`.

## Goals / Non-Goals

**Goals:**
- Table-driven unit tests for both helpers covering normal and edge-case branches.
- Tests run with no DB/network, matching the existing pure-test style.

**Non-Goals:**
- Testing `importFromURL`, `importFromImage`, `callClaude`, or `handleRecipeImport` (network/LLM-dependent — separate items).
- Any change to production behavior in `recipe_import.go`.

## Decisions

- **One new file `api/recipe_import_test.go`** holding `TestHtmlToText` and `TestStripMarkdownFences`. Keeps import-helper tests colocated, mirrors the existing one-concern-per-test-file layout.
- **`htmlToText` input via `strings.NewReader`** — the function takes an `io.Reader`; feeding HTML literals through `strings.NewReader` avoids fixture files.
- **Assertion style matches `validate_test.go`** — table of cases with a `want` (exact for `stripMarkdownFences`) and substring/line-membership checks for `htmlToText`, since `html.Parse` wraps fragments in `<html><head><body>` and node ordering for skip-tag verification is what matters. For skip-tags, assert the noise text is absent and the content text is present rather than asserting the full output string.

## Risks / Trade-offs

- [`html.Parse` normalizes fragments, so exact-string assertions on `htmlToText` are brittle] → Assert on presence/absence of specific lines instead of full-output equality.
- [Over-specifying line formatting could couple tests to incidental output] → Keep assertions to the behaviors named in the spec (visible text present, noise absent, empty→empty).
