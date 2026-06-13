## 1. Stat computation helpers

- [ ] 1.1 Add pure helpers (e.g. `src/utils/stats.js`) that bucket a resource array by month (`YYYY-MM`) from `created_at`/`date`
- [ ] 1.2 Add per-resource breakdown helpers: events by author and upcoming/past; series by status and platform; recipes by tag and average rating; activities by status

## 2. Stats detail component

- [ ] 2.1 Create a `StatsDetail` component parameterised by resource `type`, receiving the resource arrays as props
- [ ] 2.2 Render a header (which stat), the in-depth breakdowns, and a historic "items over time" trend for the selected resource
- [ ] 2.3 Render lightweight CSS/SVG visualisations (bar/sparkline) with no external chart dependency
- [ ] 2.4 Add a back control to return home and a "manage" path that navigates to the resource tab via `onNavigate`

## 3. Home wiring

- [ ] 3.1 In `HomeTab.jsx`, make each stat card open the `StatsDetail` for its resource instead of navigating directly to the tab
- [ ] 3.2 Track which stat is open with component state, consistent with the app's no-router pattern

## 4. Styling

- [ ] 4.1 Add stats styles (e.g. `src/styles/stats.js`) wired into `src/styles/index.js`, using existing design tokens

## 5. Verification

- [ ] 5.1 Verify each stat card opens its detail view with correct numbers matching the headline
- [ ] 5.2 Verify breakdowns and the historic trend reflect the loaded data
- [ ] 5.3 Verify the back control returns home and the manage path opens the correct tab
- [ ] 5.4 Verify the production bundle did not gain a heavy chart dependency

## 6. Release bookkeeping

- [ ] 6.1 Bump `package.json` `version` (minor) and add a `CHANGELOG.md` section for the release
