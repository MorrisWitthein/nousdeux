## Context

Today only movies/series use the `MediaMeta` / `MediaChips` helpers in `src/tabs/lists/shared.jsx`, which split a teal `chip-platform` from neutral `chip-genre` chips. Recipes render tags as a flat `.tag` span (`RecipesTab.jsx:471`) with metadata (rating, prep time, servings) shown separately and inconsistently. Activities show free-text `meta` (`ActivitiesSubTab.jsx`) and a status badge. There is no shared notion of "this chip is a tag" vs. "this chip is structured metadata".

The chip styles live in `src/styles/lists.js` (`.chip-platform`, `.chip-genre`) and `src/styles/cards.js` (`.badge-*`). This change is purely presentational and reuses existing data fields.

## Goals / Non-Goals

**Goals:**
- A single, documented visual convention: metadata chips look one way, tag chips look another, applied across all four resource types.
- Recipe tags become visually distinct from recipe metadata (rating/prep time/servings).
- Minimal churn to movies, which already follow the target convention.

**Non-Goals:**
- No new fields, no API/DB changes, no changes to what data is stored.
- No new filtering behaviour (genre filtering already exists for movies; not expanding it here).
- No redesign of the badge/status system beyond aligning it with the tag-vs-metadata language.

## Decisions

**Decision: Two chip roles — `metadata` and `tag` — backed by shared CSS classes.**
Generalise the existing pair: keep `chip-platform`/`chip-genre` semantics but treat them as instances of two roles. Metadata chips (platform, season, rating, prep time, servings, category) use the accent-tinted style; tag chips (free-form recipe tags) use a lighter neutral style. Reuse `chip-platform` for "primary metadata" and `chip-genre`/`.tag` for the neutral/tag style so the existing movie look is preserved.
- *Alternative considered:* per-resource bespoke styling. Rejected — defeats the purpose of a consistent language and duplicates CSS.

**Decision: Centralise chip rendering in `shared.jsx`.**
Promote the chip helpers (currently `MediaMeta`/`MediaChips`, movie/series-oriented) into role-based helpers usable by recipes and activities too, or add a small `MetaChips`/`TagChips` pair. Each tab passes its own fields; the helper decides styling. This keeps the convention in one place.
- *Alternative considered:* inline chip markup in each tab. Rejected — drift risk; the divergence we are fixing came from exactly that.

**Decision: Recipes render metadata (rating/prep/servings) as metadata chips and `tags` as tag chips, in both the card and the detail sheet.**
Mirrors the movie card's two-tier meta row.

## Risks / Trade-offs

- [Style regressions on movies/series, which already look correct] → reuse the existing `chip-platform`/`chip-genre` classes rather than renaming them, so the movie/series appearance is unchanged; only recipes/activities gain the new grouping.
- [Recipe detail layout already shows rating with stars] → keep the star rating as-is; only reclassify the textual metadata and tags into the chip roles.

## Open Questions

- Whether activity `meta` (free text) should be parsed into chips or simply styled as a single metadata line — resolve during implementation; default is a single metadata line since `meta` is unstructured.
