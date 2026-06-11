## 1. Test htmlToText

- [x] 1.1 Create `api/recipe_import_test.go` (package `main`) with a table-driven `TestHtmlToText` driving input through `strings.NewReader`
- [x] 1.2 Case: HTML with content + noise tags (`script`, `style`, `head`, `nav`, `footer`, `aside`, `iframe`, `noscript`) — assert content text present, noise text absent
- [x] 1.3 Case: empty input and whitespace-only text nodes — assert empty string, no error
- [x] 1.4 Case: nested/multiple text nodes each appear on their own line, trimmed

## 2. Test stripMarkdownFences

- [x] 2.1 Add table-driven `TestStripMarkdownFences` with exact-string `want` assertions
- [x] 2.2 Case: fenced block with language hint (```` ```json ````) returns inner content only
- [x] 2.3 Case: bare fences (```` ``` ````), surrounding prose, and trailing whitespace
- [x] 2.4 Case: no fence present returns input trimmed, unchanged

## 3. Verify

- [x] 3.1 Run `go test ./api/ -run 'TestHtmlToText|TestStripMarkdownFences' -v` and confirm pass
- [x] 3.2 Run `go test ./...` from repo root to confirm no regressions
- [x] 3.3 Bump `api/VERSION` (patch)
