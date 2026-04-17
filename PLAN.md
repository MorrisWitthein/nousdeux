# nosdeux — Development Plan

## Prototype Review

The prototype (`prototype.jsx`) is a solid, high-fidelity UI — the design work is essentially done. It's a ~1,050-line single JSX file with:

- Clean 5-tab layout: Home, Calendar, Lists, Recipes, Activities
- A consistent design system (color vars, typography, card patterns)
- Mobile-first layout (390px max-width) — already looks app-like
- Hardcoded sample data in React `useState` — resets on every refresh
- No backend, no persistence, no auth

The main gaps are plumbing, not design.

---

## Recommended Stack

| Concern        | Choice                    | Why                                               |
| -------------- | ------------------------- | ------------------------------------------------- |
| Frontend       | Vite + React SPA          | Prototype is already this; no SSR needed          |
| API            | Go (stdlib + pgx)         | Tiny binary, low RAM — fits Pi resource limits    |
| Database       | PostgreSQL (in-cluster)   | Reliable, full SQL, data stays on Pi              |
| Realtime       | SSE (Server-Sent Events)  | Simple push from Go → browser, no WebSocket overhead |
| Auth           | Username/password + JWT   | 2 users, private network — no magic links needed  |
| PWA            | vite-plugin-pwa           | Home screen install — avoids App Store            |
| Hosting        | Raspberry Pi (Kubernetes) | Self-hosted, no cloud costs                       |
| Network access | Tailscale VPN             | Private access for both users, no public URL      |

Total monthly cost: €0.

---

## Phased Roadmap

### Phase 1 — Working MVP

**Done:**
- [x] Scaffold Vite project, split prototype into component files
- [x] Add PWA config + icons (`public/icon-192.png`, `public/icon-512.png`)
- [x] Build 4 data hooks (`useEvents`, `useRecipes`, `useSeries`, `useActivities`) backed by a mock in-memory server (`src/mock/db.js`)
- [x] Replace `useState(hardcodedData)` with the hooks in all tabs
- [x] Home tab stats driven by live data; greeting adapts to time of day
- [x] `.gitignore`, `Dockerfile`, `nginx.conf`, K8s manifests (`k8s/`)

**Remaining milestones** (each leaves the app in a fully runnable state):

#### M1 — Go API scaffold (events only, in-memory, no auth)
- [x] Init `api/` Go module (`go.mod`, `main.go`)
- [x] `GET /api/events` + `POST /api/events` backed by a Go slice (no DB yet)
- [x] CORS headers so the frontend can reach it from Vite dev server
- [x] Verify with `curl` — no frontend changes yet
- [x] `Dockerfile.api` + update `.env.example` with `VITE_API_URL`

_Checkpoint: `go run ./api` starts cleanly, curl round-trip works._

#### M2 — Wire events hook to the Go API
- [x] Swap `useEvents.js` from `mockDb` to `fetch` against `VITE_API_URL`
- [x] Frontend runs against the real API for events; other 3 tabs still use mock
- [x] Add `VITE_API_URL=http://localhost:8080` to `.env.local` (gitignored)

_Checkpoint: events tab persists across page refreshes (held in API memory); rest of app still works via mock._

#### M3 — Extend API to all 4 tables + swap remaining hooks
- [x] Add `GET/POST /api/recipes`, `/series`, `/activities` (same in-memory pattern)
- [x] Swap `useRecipes.js`, `useSeries.js`, `useActivities.js`
- [x] Remove mock dependency from all hooks (mock stays in repo for reference)

_Checkpoint: full app runs against the Go API — all tabs read/write, data survives tab closes but resets on API restart._

#### M4 — SSE realtime sync
- [x] `sse/broker.go` — one broker per table, fans out `data: refresh\n\n`
- [x] Each `POST` handler pings its broker after insert
- [x] `GET /api/events/stream` (and same for other tables) — SSE endpoint
- [x] Update all 4 hooks to open an `EventSource` and call `refresh` on message

_Checkpoint: open the app in two browser tabs — adding an item in one tab appears in the other within a second._

#### M5 — JWT auth + `AuthGate`
- [x] `POST /api/login` — checks username/password from env `USERS` (JSON map of bcrypt hashes), returns signed JWT (15-day expiry)
- [x] JWT middleware guards all non-login routes
- [x] `src/AuthGate.jsx` — login form, stores token in `localStorage`, wraps `<App>`
- [x] All hooks send `Authorization: Bearer <token>`; SSE streams pass token as query param
- [x] Auto-logout on 401 response

_Checkpoint: app requires login; unknown credentials are rejected; token survives refresh._

#### M6 — Postgres (local dev via Docker Compose)
- [x] `docker-compose.yml` with Postgres 16, Go API, and frontend services
- [x] `api/db/connect.go` — pgx connection pool from `DB_DSN` env var
- [x] `api/db/migrate.go` — versioned SQL migrations (`api/db/migrations/NNN_*.sql`), auto-applied on startup
- [x] Swap all in-memory slices for pgx queries
- [x] Update `.env.example` with `DB_DSN`

_Checkpoint: `docker compose up` + `go run ./api` — data now survives API restarts; two local browser sessions stay in sync via SSE._

### Phase 2 — Quality of Life

#### M7 — Dynamic user attribution from JWT
- [x] Decode JWT `sub` claim in frontend (e.g. `parseJwt()` helper)
- [x] Pass logged-in username to all add forms; map `"max"→"M"`, `"lena"→"L"` for `who` field
- [x] Remove hardcoded `who: 'M'` from CalendarTab, RecipesTab, ActivitiesTab, ListsTab

_Checkpoint: Lena's additions show her badge, Max's show his — no code change needed per user._

#### M8 — Delete items
- [ ] Add `DELETE /api/{table}/{id}` endpoints in Go API (one per table)
- [ ] Add `002_` migration if needed (soft-delete column) or use hard delete
- [ ] Add delete button on each card (recipe, series, activity, event) with confirmation
- [ ] Hooks gain a `deleteX(id)` function; SSE triggers refresh on other clients

_Checkpoint: long-press or tap trash icon removes an item; change appears on both devices._

#### M9 — Edit items
- [ ] Add `PATCH /api/{table}/{id}` endpoints in Go API (one per table)
- [ ] Tap a card to open a pre-filled edit form (reuse add form with populated fields)
- [ ] Hooks gain an `updateX(id, fields)` function; SSE triggers refresh
- [ ] Support editing: title, emoji, tags, rating, status, progress, date/time, meta

_Checkpoint: tap a recipe → change its rating → save → updated everywhere._

#### M10 — Dynamic calendar
- [ ] Compute month grid from `Date` object (replace hardcoded April 2026 array in `data.js`)
- [ ] Wire `‹` / `›` nav buttons to change month (`useState` for current year/month)
- [ ] Highlight days that have events (dot indicator or accent background)
- [ ] Click a calendar day to open the add-event form with that date pre-filled

_Checkpoint: navigate months freely; days with events are visually marked; tap a day to add._

#### M11 — Emoji picker + status/badge selectors
- [ ] Add a simple emoji picker to recipe, series, and activity add/edit forms (grid of ~20 relevant emoji per category)
- [ ] Add a status dropdown to series form (Geplant / Läuft / Fertig) with color mapping
- [ ] Add a badge-type selector to event form (Geplant / Bestätigt / Idee or similar)
- [ ] Add a star-rating selector to recipe form (tap 1–5 stars)

_Checkpoint: new items have user-chosen emoji, status, and ratings instead of hardcoded defaults._

#### M12 — Movies & Books tabs
- [ ] Add `movies` and `books` tables (migration `003_movies_books.sql`) — similar schema to series/recipes
- [ ] Add Go API endpoints: `GET/POST/DELETE/PATCH /api/movies`, `/api/books` + SSE streams
- [ ] Add `useMovies.js` and `useBooks.js` hooks
- [ ] Replace "Noch leer" placeholders in ListsTab with real card lists + add forms

_Checkpoint: Movies and Books tabs are fully functional — add, view, delete, edit._

#### M13 — Deploy to Pi
- [ ] `k8s/postgres.yaml` — Postgres 16 Deployment + 5 Gi PVC + ClusterIP Service
- [ ] `k8s/api.yaml` — Go API Deployment + ClusterIP Service; env from `secret.yaml`
- [ ] `k8s/secret.yaml` — `DB_DSN`, `JWT_SECRET`, `USERS` (fill real bcrypt hashes, never commit)
- [ ] Update `k8s/frontend.yaml` with `VITE_API_URL` baked in at build time
- [ ] Build both images on Pi (`imagePullPolicy: Never`), `kubectl apply -f k8s/`
- [ ] Verify on both phones over Tailscale: login, add item, see it appear on the other device

_Checkpoint: both phones can log in, add items, and see each other's changes in real time. PWA install works._

### Phase 3 — Nice to Have (later, if wanted)

- Push notifications ("Lena hat ein neues Rezept hinzugefügt")
- Recipe detail view with ingredients/steps
- Photo uploads for recipes (stored on Pi via the Go API)

---

## Project Structure (target)

```
nosdeux/
├── api/                        # Go API
│   ├── main.go                 # HTTP server, route registration
│   ├── db/
│   │   ├── connect.go          # pgx connection pool
│   │   └── migrate.go          # runs schema migrations on startup
│   ├── handlers/
│   │   ├── auth.go             # POST /api/login → JWT
│   │   ├── events.go           # GET/POST /api/events, GET /api/events/stream
│   │   ├── recipes.go
│   │   ├── series.go
│   │   └── activities.go
│   ├── middleware/
│   │   └── auth.go             # JWT validation middleware
│   ├── sse/
│   │   └── broker.go           # SSE broadcast hub (one per table)
│   ├── go.mod
│   └── go.sum
├── public/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── mock/
│   │   └── db.js               # kept for local dev without the API running
│   ├── hooks/
│   │   ├── useEvents.js        # fetch + EventSource against Go API
│   │   ├── useRecipes.js
│   │   ├── useSeries.js
│   │   └── useActivities.js
│   ├── tabs/
│   │   ├── HomeTab.jsx
│   │   ├── CalendarTab.jsx
│   │   ├── ListsTab.jsx
│   │   ├── RecipesTab.jsx
│   │   └── ActivitiesTab.jsx
│   ├── App.jsx
│   ├── AuthGate.jsx            # login form → JWT → localStorage
│   ├── styles.js
│   ├── data.js
│   └── main.jsx
├── k8s/
│   ├── postgres.yaml           # Postgres Deployment + PVC + ClusterIP Service
│   ├── api.yaml                # Go API Deployment + ClusterIP Service
│   ├── frontend.yaml           # nginx Deployment + NodePort 30080
│   └── secret.yaml             # DB password, JWT secret, user credentials
├── .env.example                # VITE_API_URL
├── .gitignore
├── Dockerfile                  # multi-stage: node build → nginx (frontend)
├── Dockerfile.api              # multi-stage: go build → distroless (API)
├── nginx.conf
├── vite.config.js
├── index.html
└── package.json
```

---

## Building the Real Backend

### 1 — Postgres schema

Run once on first startup (or apply via `migrate.go`):

```sql
create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text,
  time text,
  who char(1) not null,
  badge text,
  badge_type text,
  created_at timestamptz default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  emoji text,
  title text not null,
  tags text[],
  who char(1) not null,
  rating text default '–',
  created_at timestamptz default now()
);

create table if not exists series (
  id uuid primary key default gen_random_uuid(),
  emoji text,
  title text not null,
  sub text,
  progress int default 0,
  status text default 'Geplant',
  status_type text default 'yellow',
  created_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  emoji text,
  title text not null,
  meta text,
  who char(1) not null,
  created_at timestamptz default now()
);
```

### 2 — Go API overview

**Dependencies** (go.mod):
```
github.com/jackc/pgx/v5
github.com/golang-jwt/jwt/v5
```

No router framework needed — stdlib `net/http` with a simple prefix mux is enough for ~10 routes.

**Routes:**
```
POST /api/login                  → returns signed JWT (15-day expiry)
GET  /api/events                 → list all, newest first
POST /api/events                 → insert row, broadcast SSE event
GET  /api/events/stream          → SSE — client subscribes for live updates
(same pattern for /recipes, /series, /activities)
```

**Auth flow:** `POST /api/login` receives `{username, password}`, checks against credentials in env/config, returns `{token}`. All other routes require `Authorization: Bearer <token>`. The JWT payload carries `sub` (username) so the API knows who is writing.

**SSE broker** (`sse/broker.go`): one broker per table. Each `GET .../stream` request registers a channel. When a `POST` mutates a row, it pings the broker which fans out a `data: refresh\n\n` event to all connected clients. The frontend hook responds by re-fetching the full list — simple and stateless.

### 3 — Frontend hooks (fetch + EventSource)

Each hook follows the same pattern:

```js
// src/hooks/useEvents.js
import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export function useEvents() {
  const [events, setEvents] = useState([])

  const refresh = async () => {
    const res = await fetch(`${API}/api/events`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    if (res.ok) setEvents(await res.json())
  }

  useEffect(() => {
    refresh()
    const es = new EventSource(`${API}/api/events/stream?token=${localStorage.getItem('token')}`)
    es.onmessage = refresh
    return () => es.close()
  }, [])

  const addEvent = (event) =>
    fetch(`${API}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(event),
    })

  return { events, addEvent }
}
```

### 4 — AuthGate (JWT login)

`src/AuthGate.jsx` shows a username + password form. On submit it calls `POST /api/login`, stores the returned JWT in `localStorage`, and renders `children`. On app load it checks for an existing token before showing the login screen.

### 5 — Kubernetes manifests

**`k8s/postgres.yaml`** — Postgres 16 Deployment + 5 Gi PVC + ClusterIP Service on port 5432. Uses `secret.yaml` for `POSTGRES_PASSWORD`.

**`k8s/api.yaml`** — Go API Deployment (1 replica) + ClusterIP Service on port 8080. Mounts env vars from `secret.yaml`: `DB_DSN`, `JWT_SECRET`, `USERS` (JSON map of `{"max":"<bcrypt>","lena":"<bcrypt>"}`).

**`k8s/frontend.yaml`** — existing nginx setup, renamed from `deployment.yaml`/`service.yaml`. Gets a new env var `VITE_API_URL` baked in at build time pointing to the API's ClusterIP (or the same NodePort if you want to keep a single external port).

**`k8s/secret.yaml`** (never commit real values):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: nosdeux-secret
stringData:
  DB_DSN: "postgres://nosdeux:changeme@postgres:5432/nosdeux"
  JWT_SECRET: "changeme"
  USERS: '{"max":"<bcrypt-hash>","lena":"<bcrypt-hash>"}'
```

### 6 — Build & deploy

```bash
# Generate bcrypt hashes for passwords (Go one-liner)
go run -e 'import "golang.org/x/crypto/bcrypt"; fmt.Println(string(must(bcrypt.GenerateFromPassword([]byte("yourpassword"), 12))))'

# Build images on the Pi (imagePullPolicy: Never)
docker build -t nosdeux-frontend:latest .
docker build -f Dockerfile.api -t nosdeux-api:latest ./api

kubectl apply -f k8s/
```

Access via `http://<pi-tailscale-ip>:30080`. Open in Safari/Chrome → "Add to Home Screen" to install the PWA.

---

## PWA Install Instructions

**iOS:** Safari → Share button → "Zum Home-Bildschirm hinzufügen"  
**Android:** Chrome shows an automatic "App installieren" banner, or use the menu → "App installieren"
