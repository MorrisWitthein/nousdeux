## Context

The profile modal (`src/components/ProfileModal.jsx`) already renders account info, an admin-only Gen-Z toggle, password change, logout, and a version link to `github.com/MorrisWitthein/nousdeux/releases/tag/v${__APP_VERSION__}`. The repo and version constant are therefore already available client-side. GitHub supports prefilling a new issue via query params: `https://github.com/<owner>/<repo>/issues/new?title=...&body=...`.

## Goals / Non-Goals

**Goals:**
- One tap from the profile modal to a prefilled GitHub issue.
- Auto-include app version and browser context so reports are actionable.
- German UI copy consistent with the rest of the app.

**Non-Goals:**
- No in-app issue submission via the GitHub API (would need a token / backend). The user submits on GitHub.
- No screenshot capture or log collection.
- No new settings or persistence.

## Decisions

**Decision: Build a `github.com/.../issues/new` URL with `title` and `body` query params and open it in a new tab.**
Reuse the repo path already hardcoded in the version link. URL-encode the params. Open with `target="_blank"` + `rel="noopener noreferrer"`, matching the existing version link.
- *Alternative considered:* a GitHub issue *template* (`?template=bug.md`). Optional nicety; the inline `body` template is simpler and needs no repo file. Could add a template file later.

**Decision: Prefill the body with version + user agent + a short German template.**
Body includes lines like `App-Version: vX.Y.Z`, `Browser: <navigator.userAgent>`, then `### Was ist passiert?`, `### Erwartetes Verhalten`, `### Schritte zum Reproduzieren`. This gives triage context without any backend.

**Decision: Place the button near the version link / logout in the profile modal.**
It is a low-frequency action; group it with the other account/meta actions rather than the primary tabs.

## Risks / Trade-offs

- [Very long user agents make ugly URLs] → acceptable; GitHub handles long prefilled bodies fine, and the user can trim before submitting.
- [Repo path is hardcoded in two places now] → minor; optionally extract a `REPO_URL` constant shared with the version link.

## Open Questions

- Whether to add a committed GitHub issue template (`.github/ISSUE_TEMPLATE/bug.md`) and reference it via `?template=` — defer; inline body is sufficient for v1.
