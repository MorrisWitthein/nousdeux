## Context

The entire design system is CSS variables on `:root` in `src/styles/base.js` (`--cream`, `--warm`, `--ink`, `--muted`, `--accent`, `--accent2`, `--accent3`, `--card`, `--border`). Components reference these variables, so a theme switch is mostly a matter of overriding the variable values under a selector. However, some component files and inline styles hard-code colours (e.g. `#fff`, badge backgrounds like `#FEE9E5` in `cards.js`, white toggle knobs in `ProfileModal.jsx`); those need auditing so dark mode does not leave light-on-light artefacts.

Settings persistence already exists (`useSettings` + `/api/settings`), but the PATCH endpoint is **admin-only** and the settings table is **global** (one value shared by both users). A theme is a per-device personal preference, so the global admin-gated store is the wrong fit.

## Goals / Non-Goals

**Goals:**
- A complete dark palette that covers backgrounds, text, cards, borders, and accents.
- A toggle in the profile modal that switches instantly.
- Persistence across reloads, applied before first paint (no white flash).
- Sensible default from `prefers-color-scheme` when the user has not chosen.

**Non-Goals:**
- No per-component redesign beyond swapping colours; layout stays identical.
- No syncing the theme between the two users or across devices (it is per-device).
- No theme beyond light/dark (no custom accent picker).

## Decisions

**Decision: Override CSS variables under a `[data-theme="dark"]` selector on `<html>`.**
Add a dark block in `src/styles/base.js` that re-declares the palette variables. Because components already use the variables, most of the app themes for free. Toggling sets/removes the attribute on `document.documentElement`.
- *Alternative considered:* a `.dark` class. Equivalent; `data-theme` reads better and leaves room for future themes.

**Decision: Persist in `localStorage`, not the settings table.**
The settings PATCH is admin-only and global; forcing both users onto one admin-chosen theme is wrong for a personal display preference. `localStorage` keeps it per-device and needs no backend. (This deviates from the TODO's "persisted via settings" wording; the rationale is the admin-gating + global nature of the settings store.)
- *Alternative considered:* extend the settings API to be per-user and non-admin for theme. Rejected for this change — larger scope (auth/RLS rethink) for a display preference.

**Decision: Apply the stored/inferred theme before first paint.**
A tiny inline script in `index.html` (or the very top of `src/main.jsx`) reads `localStorage` (falling back to `prefers-color-scheme`) and sets `data-theme` on `<html>` synchronously, avoiding a light-mode flash on dark devices.

**Decision: Audit and vari-ize hard-coded colours.**
Sweep style modules and inline styles for literal colours that break in dark mode (white knobs, badge tints, shadows) and route them through variables (existing or new, e.g. a `--shadow` / `--badge-*`), so the dark palette is genuinely complete.

## Risks / Trade-offs

- [Hard-coded colours leave light artefacts in dark mode] → the audit task is mandatory, not optional; verification includes visually checking every tab and sheet in dark mode.
- [Flash of light theme before JS runs] → mitigated by the pre-paint inline script.
- [Badge tints (`#FEE9E5`, `#E3F0EE`, …) may have poor contrast on dark backgrounds] → provide dark-tuned values for badge/chip backgrounds under the dark selector.

## Open Questions

- Whether to expose an explicit "System" option in addition to light/dark, or just a binary toggle that seeds from the OS preference — default to a binary toggle seeded from `prefers-color-scheme`; revisit if users want an explicit system-follow mode.
