## Why

Movies already distinguish *where to watch* from *what it is*: the platform renders as a prominent teal `chip-platform` while genres render as lighter neutral `chip-genre` (`src/tabs/lists/shared.jsx`, `MediaMeta`). No other resource type makes this distinction. Recipe tags, series metadata, and activity meta all read as undifferentiated text or identical chips, so users cannot tell a free-form tag from structured metadata at a glance. The roadmap calls for mirroring the movie behaviour across all resource types.

## What Changes

- Establish one consistent visual language across all resource cards and detail sheets: **structured metadata** (platform, season, rating, prep time, servings, status, activity category) is visually distinct from **free-form tags** (recipe tags, and any user-entered labels).
- Recipes: render `tags` as tag chips clearly distinct from metadata (rating, prep time, servings), instead of the current single `.tag` style with no metadata grouping.
- Series & activities: align their meta rows with the movie model so metadata chips and tag chips read consistently with movies.
- Keep the existing movie behaviour as the reference; movies need at most minor class adjustments to share the unified chip styles.
- No new data is collected — this is presentational; it reuses fields that already exist on each resource.

## Capabilities

### New Capabilities
- `resource-metadata-display`: How resource cards and detail sheets visually present structured metadata versus free-form tags, consistently across recipes, series, movies, and activities.

### Modified Capabilities
<!-- No existing spec for resource metadata display; captured as a new capability. -->

## Impact

- Frontend only. Affected files: `src/tabs/lists/shared.jsx` (shared chip components), `src/tabs/RecipesTab.jsx`, `src/tabs/lists/SeriesSubTab.jsx`, `src/tabs/lists/MoviesSubTab.jsx`, `src/tabs/lists/ActivitiesSubTab.jsx`, and `src/styles/lists.js` / `src/styles/cards.js` (chip styles).
- No API, DB, or data-layer changes.
- Bump `package.json` version and add a `CHANGELOG.md` entry (frontend release rules).
