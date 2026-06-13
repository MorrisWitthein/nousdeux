## 1. Dark palette

- [x] 1.1 In `src/styles/base.js`, add a `[data-theme="dark"]` block overriding the palette variables (`--cream`, `--warm`, `--ink`, `--muted`, `--card`, `--border`, and tuned `--accent*`)
- [x] 1.2 Add dark-tuned values for badge/chip backgrounds (`.badge-*` in `cards.js`, `.chip-*` in `lists.js`) so contrast holds on dark backgrounds

## 2. Colour audit (completeness)

- [x] 2.1 Sweep `src/styles/*.js` and inline component styles for hard-coded colours (white knobs, shadows, badge tints) and route them through CSS variables
- [x] 2.2 Verify the `html, body` background (currently `var(--cream)`) and the iOS PWA strip follow the dark palette

## 3. Theme application & persistence

- [x] 3.1 Add a theme util/hook that reads the stored theme from `localStorage` (default from `prefers-color-scheme`) and toggles `data-theme` on `document.documentElement`
- [x] 3.2 Add a pre-paint inline script (in `index.html` or top of `src/main.jsx`) that applies the stored/inferred theme synchronously to avoid a flash
- [x] 3.3 Persist the user's choice to `localStorage` on toggle

## 4. Profile toggle

- [x] 4.1 In `src/components/ProfileModal.jsx`, add a dark-mode toggle (switch) consistent with the existing toggle styling, wired to the theme util

## 5. Verification

- [x] 5.1 Verify toggling switches the whole app instantly with no light-on-light or dark-on-dark artefacts on any tab or sheet
- [x] 5.2 Verify the choice persists across reloads and no light flash occurs on a dark-preference device
- [x] 5.3 Verify a fresh user with no stored choice defaults to the OS `prefers-color-scheme`

## 6. Release bookkeeping

- [x] 6.1 Bump `package.json` `version` (minor) and add a `CHANGELOG.md` section for the release
