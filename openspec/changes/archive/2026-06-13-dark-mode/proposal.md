## Why

The app ships a single warm cream/ink light palette defined as CSS variables in `src/styles/base.js`. In the evening — which is exactly when a two-person planning app gets used — a bright cream screen is harsh. A dark mode with a toggle in the profile gives users a comfortable option without changing any component code, because the whole design system is already driven by CSS variables.

## What Changes

- Add a **dark palette** as an alternative set of values for the existing CSS variables (`--cream`, `--warm`, `--ink`, `--muted`, `--card`, `--border`, and tuned accents), applied via a `data-theme="dark"` attribute (or `.dark` class) on a root element.
- Add a **dark-mode toggle** to the profile modal (`ProfileModal.jsx`), alongside the existing toggles.
- **Persist** the choice per device via `localStorage` and apply it on load before first paint to avoid a flash.
- Honour the OS preference (`prefers-color-scheme`) as the initial default when the user has not chosen explicitly.

## Capabilities

### New Capabilities
- `theming`: Light/dark theme selection — palette switching via CSS variables, a profile toggle, persistence, and OS-preference default.

### Modified Capabilities
<!-- No existing spec covers theming; captured as a new capability. -->

## Impact

- Frontend only. Affected files: `src/styles/base.js` (dark variable block + any hard-coded colours that must become variables), `src/components/ProfileModal.jsx` (toggle), a small theme hook/util (apply + persist), and `index.html` / `src/main.jsx` (apply stored theme before paint).
- Audit other style modules (`cards.js`, `lists.js`, `nav.js`, `forms.js`, `calendar.js`) and inline component styles for hard-coded colours that should reference variables so dark mode is complete.
- No API or DB changes (persistence is `localStorage`, not the admin-gated settings table — see design).
- Bump `package.json` version and add a `CHANGELOG.md` entry (frontend release rules).
