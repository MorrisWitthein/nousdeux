## Why

The home screen shows four stat cards — events this month, running series, recipes collected, activities planned (`HomeTab.jsx`). They are now tappable but only navigate to the corresponding tab. Users want to drill into a stat for a richer picture: in-depth per-resource statistics, historic trends, and simple visualisations, rather than just a single headline number.

## What Changes

- Tapping a home-screen stat card opens a **statistics detail view** for that resource (events, series, recipes, or activities) instead of jumping straight to the tab.
- The detail view shows **in-depth per-resource stats** (e.g. for events: counts by month, by author, upcoming vs. past; for series: by status and platform; for recipes: by tag, average rating; for activities: by status).
- It shows **historic data** over time (e.g. items added per month) and **simple visualisations** (bar/sparkline-style, lightweight — no heavy chart library, mindful of the bundle-size constraints).
- A clear way to leave the detail view and return home, plus a path to the full tab for managing items.
- Stats are **derived client-side** from data already loaded in `App.jsx` hooks; no new data is collected.

## Capabilities

### New Capabilities
- `statistics-detail`: A drill-in view from each home stat card presenting in-depth per-resource statistics, historic trends, and lightweight visualisations.

### Modified Capabilities
<!-- No existing spec covers the home stats; captured as a new capability. -->

## Impact

- Frontend only. Affected files: `src/tabs/HomeTab.jsx` (stat cards open the detail view), a new stats detail component (e.g. `src/tabs/home/StatsDetail.jsx`), small stat-computation helpers, and styles (likely a new `src/styles/stats.js` wired into `src/styles/index.js`).
- Reuses existing data from the `useEvents` / `useSeries` / `useRecipes` / `useActivities` hooks via `App.jsx`; no API, DB, or data-layer changes.
- Keep visualisations dependency-free (CSS/SVG) to respect the Raspberry Pi bundle-size limits.
- Bump `package.json` version and add a `CHANGELOG.md` entry (frontend release rules).
