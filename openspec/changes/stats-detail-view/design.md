## Context

`HomeTab.jsx` receives `events`, `recipes`, `series`, `activities` (and `loading`) from `App.jsx`, which owns all data via the four hooks. The four stat cards currently compute a single number each and call `onNavigate?.(tab)` on tap. All the raw data needed for richer stats is already in props — events carry `date`/`who`, series carry `status`/`sub` (platform), recipes carry `tags`/`rating`/`created_at`, activities carry `status`. No new fetching is required.

The deployment target (Raspberry Pi, 32–64 MB RAM, minimal bundle) means no heavy charting dependency; visualisations should be CSS/SVG.

## Goals / Non-Goals

**Goals:**
- A drill-in detail view per stat card showing more than the headline number: breakdowns, historic trend, and a lightweight chart.
- Stats derived purely client-side from already-loaded data.
- Easy return home and a path into the full tab.

**Non-Goals:**
- No new API endpoints or aggregation tables; everything is computed in the client.
- No heavyweight chart library (Chart.js, recharts) — keep the bundle small.
- No historic data that the app does not already have (history is limited to what `created_at`/`date` fields allow; no backfilled analytics store).

## Decisions

**Decision: Reuse the existing `selectedTab`-style state pattern; open the detail as an overlay/section rather than routing.**
Consistent with the app's no-React-Router approach (`App.jsx` owns a single active-tab state). The stats detail is presented as a sheet/overlay or a home sub-view keyed by which stat was tapped, with a back control. Tapping "manage" navigates to the corresponding tab via the existing `onNavigate`.
- *Alternative considered:* a new top-level tab. Rejected — stats are a drill-in from home, not a peer destination.

**Decision: A single `StatsDetail` component parameterised by resource type.**
It takes the resource arrays and a `type` and renders the relevant breakdowns. Per-type stat computation lives in small pure helpers (testable) rather than inline, e.g. counts-by-month, counts-by-author, counts-by-status.
- *Alternative considered:* four bespoke components. Rejected — most layout (header, sections, chart) is shared; parameterise instead.

**Decision: Lightweight CSS/SVG visualisations.**
Render bar charts as flex/`div` height bars or inline SVG sparklines. No external dependency. Historic "per month" series come from bucketing `created_at` / `date` by `YYYY-MM`.

**Decision: Derive history from existing timestamps only.**
Events use `date`; recipes/series/activities use `created_at`. We do not introduce an analytics/event-log table; "historic data" means trends derivable from existing rows. This bounds scope and avoids DB work.

## Risks / Trade-offs

- ["Historic data" expectations may exceed what existing timestamps allow] → scope the trend to what `created_at`/`date` supports (items over time); call this out so it is not mistaken for a full analytics store.
- [HomeTab already holds a lot of greeting logic] → keep stats computation in separate helpers and the detail in its own component to avoid bloating `HomeTab.jsx`.
- [Bundle size] → no chart dependency; CSS/SVG only.

## Open Questions

- Exactly which breakdowns matter most per resource — start with the obvious ones (by month, by author/status, by tag/platform, average rating) and refine with the users during implementation.
