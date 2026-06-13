## Why

When something breaks, Max or Lena have no in-app way to report it — they have to remember the problem and file a GitHub issue manually from a computer. A "Report a bug" button in the profile modal that opens a prefilled GitHub issue removes that friction and captures useful context (app version, browser) automatically.

## What Changes

- Add a **"Fehler melden"** (Report a bug) button to the profile modal (`ProfileModal.jsx`).
- Tapping it opens the project's GitHub **new issue** page in a new tab, with the title and body **prefilled** via URL query parameters.
- The prefilled body includes helpful context: the current app version (`__APP_VERSION__`), and the browser/user-agent string, plus a short template ("Was ist passiert?", "Erwartetes Verhalten", "Schritte").
- No backend involvement — this is a client-side link to `github.com/MorrisWitthein/nousdeux/issues/new?...`.

## Capabilities

### New Capabilities
- `bug-report`: An in-app affordance to report a bug by opening a prefilled GitHub issue.

### Modified Capabilities
<!-- No existing spec covers the profile modal; bug reporting is captured as a new capability. -->

## Impact

- Frontend only. Affected files: `src/components/ProfileModal.jsx` (new button), optionally a small helper to build the issue URL.
- No API, DB, or data-layer changes.
- Bump `package.json` version and add a `CHANGELOG.md` entry (frontend release rules).
