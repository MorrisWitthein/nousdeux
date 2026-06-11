## ADDED Requirements

### Requirement: Recipe-import parsing helpers are covered by tests

The recipe-import parsing helpers `htmlToText` and `stripMarkdownFences` SHALL have table-driven unit tests exercising their main valid and edge-case branches, so that a regression in HTML text extraction or markdown-fence trimming fails the build. These tests SHALL be pure (no database or network) and run unconditionally under `go test ./...`.

#### Scenario: htmlToText extracts visible text and skips noise tags

- **WHEN** `htmlToText` is given an HTML document containing both content elements and noise elements (`script`, `style`, `head`, `nav`, `footer`, `aside`, `iframe`, `noscript`)
- **THEN** it returns the trimmed text content of the content elements, each non-empty text node on its own line, and omits the text inside the noise elements

#### Scenario: htmlToText handles empty and whitespace-only input

- **WHEN** `htmlToText` is given empty input or HTML whose only text nodes are whitespace
- **THEN** it returns an empty string and no error

#### Scenario: stripMarkdownFences unwraps fenced content

- **WHEN** `stripMarkdownFences` is given a string wrapping JSON in a fenced block (with or without a language hint such as ```` ```json ````, and with or without surrounding prose)
- **THEN** it returns only the inner content with the opening fence line and closing fence removed, trimmed of surrounding whitespace

#### Scenario: stripMarkdownFences leaves unfenced content intact

- **WHEN** `stripMarkdownFences` is given a string that contains no code fence
- **THEN** it returns the input trimmed of surrounding whitespace, otherwise unchanged
