# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**nosdeux** (nous deux) — a shared planning PWA for two users (Max & Lena) to manage events, recipes, TV series, and activities. German-language UI. Phase 1 MVP uses an in-memory mock database; Phase 2+ will migrate to Supabase.

## Commands

```bash
npm run dev       # Dev server with HMR (localhost:5173)
npm run build     # Production build → /dist
npm run preview   # Preview production build locally
```

No lint or test scripts are configured yet.

**Docker build** (pass Supabase env vars at build time):
```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  -t nosdeux:latest .
```

**Kubernetes deploy:**
```bash
kubectl apply -f k8s/
# Access via http://<pi-tailscale-ip>:30080
```

## Architecture

### Stack
- React 18 + Vite 6, plain JavaScript/JSX (no TypeScript)
- `vite-plugin-pwa` for installable PWA (auto-update)
- All styles in `src/styles.js` as a CSS template string injected via `<style>` tag — no CSS modules or Tailwind
- No external UI component library

### Data Layer Pattern

The app uses a **pub/sub mock database** in `src/mock/db.js` with an async interface designed to mirror the Supabase JS client. Each of the 4 hooks in `src/hooks/` follows the same pattern:

```
useEffect → mockDb.select(table)         // initial load
          → mockDb.subscribe(table, cb)  // live updates
mutations → mockDb.insert/delete(table)  // triggers subscribers
```

When migrating to Supabase, only the hook internals change — no component code needs to touch the data layer.

### Tab Routing

`App.jsx` owns all state: active tab (useState) + all 4 data hooks. It passes data and callbacks down to tab components. There is no React Router — navigation is a single `activeTab` state variable rendering one of 5 tab components.

### Design System

Defined entirely in `src/styles.js`. Key CSS variables:
- `--cream` / `--warm` — backgrounds
- `--ink` / `--muted` — text
- `--accent` (#C8553D, Lena/red) · `--accent2` (#4A7C6F, Max/teal) · `--accent3` (#D4A853, gold)
- Fonts: Fraunces (serif, headings) + DM Sans (sans, body) via Google Fonts

Author badges use `--accent` for L (Lena) and `--accent2` for M (Max) consistently across all tabs.

### Seed Data

`src/data.js` contains the initial dataset and the April 2026 calendar grid. The calendar is currently hardcoded to April 2026; dynamic month generation is a Phase 2 item.

## Planned Supabase Migration (Phase 2)

`PLAN.md` has the full SQL schema and migration guide. The short version:
1. Create 4 tables: `events`, `recipes`, `series`, `activities` with RLS policies
2. Swap `mockDb` calls in `src/hooks/*.js` for `@supabase/supabase-js`
3. Add `AuthGate` component with magic-link login
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time (see `k8s/secret.yaml`)

## Schema Migrations

SQL migrations live in `api/db/migrations/` as numbered files (`001_initial.sql`, `002_add_foo.sql`, etc.). They are embedded into the Go binary via `//go:embed` and run automatically on API startup.

**How it works:**
1. A `schema_migrations` table tracks which versions have been applied
2. On startup, `db.Migrate()` compares files against applied versions
3. Unapplied files run in order, each in its own transaction
4. If a migration fails, the transaction rolls back and the API exits

**Adding a migration:**
1. Create `api/db/migrations/NNN_description.sql` (zero-padded number, underscore, name)
2. Write idempotent SQL when possible (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`)
3. Restart the API — it applies automatically

**Rules:**
- Never edit an already-applied migration — create a new one instead
- Migrations must be additive in production (no `DROP COLUMN` without a plan)
- Test locally first: `docker compose up -d` then `go run ./api`

## Deployment Target

Raspberry Pi running Kubernetes, accessed privately via Tailscale VPN. NodePort 30080. Image is built locally (`imagePullPolicy: Never`). Resource limits are minimal (32–64 MB RAM, 50–200m CPU) — keep bundle size in check.
