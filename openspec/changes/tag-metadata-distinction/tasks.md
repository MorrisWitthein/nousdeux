## 1. Shared chip roles

- [ ] 1.1 In `src/tabs/lists/shared.jsx`, define role-based chip helpers (e.g. `MetaChips` for structured metadata, `TagChips` for free-form tags) or generalise `MediaMeta`/`MediaChips` so both roles are reusable across all tabs
- [ ] 1.2 In `src/styles/lists.js` (and `src/styles/cards.js` if needed), ensure two distinct chip styles exist: a prominent accent-tinted metadata chip (reuse `.chip-platform`) and a lighter neutral tag chip (reuse/extend `.chip-genre` / `.tag`)

## 2. Recipes

- [ ] 2.1 In `RecipesTab.jsx`, render recipe `tags` using the tag-chip style in both the card and the detail sheet
- [ ] 2.2 Render recipe metadata (prep time, servings) as metadata chips, visually distinct from tags; keep the existing star rating as-is

## 3. Series & activities

- [ ] 3.1 In `SeriesSubTab.jsx`, confirm platform renders as a metadata chip and season as a metadata chip; align with the shared helpers (no visual regression vs. today)
- [ ] 3.2 In `ActivitiesSubTab.jsx`, render the activity status as a metadata indicator and the `meta` line consistently with the metadata styling

## 4. Movies (reference)

- [ ] 4.1 In `MoviesSubTab.jsx`, switch to the shared chip helpers if extracted, keeping the current platform/genre appearance unchanged

## 5. Verification

- [ ] 5.1 Verify on each tab that structured metadata and free-form tags are visually distinguishable at a glance
- [ ] 5.2 Verify movies and series look unchanged from before
- [ ] 5.3 Verify recipe tags are clearly distinct from recipe metadata in both card and detail views

## 6. Release bookkeeping

- [ ] 6.1 Bump `package.json` `version` (minor) and add a `CHANGELOG.md` section for the release
