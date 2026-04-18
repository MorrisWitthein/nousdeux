# nousdeux

A shared planning PWA for two users to manage events, recipes, TV series, and activities. German-language UI, self-hosted on a Raspberry Pi via Kubernetes, accessed privately over Tailscale.

## Stack

| Layer    | Tech                          |
| -------- | ----------------------------- |
| Frontend | React 18 + Vite 6 (JSX, PWA) |
| API      | Go (stdlib net/http)          |
| Database | PostgreSQL 16                 |
| Realtime | Server-Sent Events (SSE)      |
| Auth     | JWT (bcrypt passwords)        |
| Hosting  | Raspberry Pi + Kubernetes     |
| Network  | Tailscale VPN                 |

## Quick start (Docker Compose)

The fastest way to run the full stack locally:

```bash
# Generate a bcrypt hash for a test password
htpasswd -nbBC 12 "" test | cut -d: -f2

# Start everything (Postgres + API + frontend)
USERS='{"max":"<paste-hash>","lena":"<paste-hash>"}' docker compose up --build
```

- Frontend: http://localhost:8081
- API: http://localhost:8080
- Postgres: localhost:5432

Data persists in a Docker volume across restarts.

## Local development (without Docker)

### Prerequisites

- Node.js 18+
- Go 1.22+
- PostgreSQL 16 (or use `docker compose up postgres` for just the DB)

### Database

Start Postgres via Docker Compose:

```bash
docker compose up -d postgres
```

This creates the `nousdeux` database on `localhost:5432`.

### Frontend

```bash
npm install
cp .env.example .env.local   # sets VITE_API_URL=http://localhost:8080
npm run dev                   # http://localhost:5173
```

### API

Generate a bcrypt hash for a test password:

```bash
htpasswd -nbBC 12 "" test | cut -d: -f2
```

Start the API:

```bash
DB_DSN=postgres://nousdeux:nousdeux@localhost:5432/nousdeux \
JWT_SECRET=dev-secret \
USERS='{"max":"<paste-hash>","lena":"<paste-hash>"}' \
go run ./api
```

The API listens on `http://localhost:8080`. Schema migrations run automatically on startup. Both users can log in with password `test`.

### API environment variables

| Variable     | Required | Description                                         |
| ------------ | -------- | --------------------------------------------------- |
| `DB_DSN`     | Yes      | Postgres connection string                          |
| `API_ADDR`   | No       | Listen address (default `:8080`)                    |
| `JWT_SECRET` | Yes      | Secret key for signing JWTs                         |
| `USERS`      | Yes      | JSON map of `username` to bcrypt hash               |

### Schema migrations

SQL migrations live in `api/db/migrations/` as numbered files. They are embedded into the binary and run automatically on startup. See [CLAUDE.md](CLAUDE.md) for the full workflow.

### API endpoints

| Method | Path                    | Auth     | Description             |
| ------ | ----------------------- | -------- | ----------------------- |
| POST   | `/api/login`            | No       | Returns signed JWT      |
| GET    | `/api/events`           | Bearer   | List all events         |
| POST   | `/api/events`           | Bearer   | Create event            |
| GET    | `/api/events/stream`    | `?token` | SSE stream for events   |
| GET    | `/api/recipes`          | Bearer   | List all recipes        |
| POST   | `/api/recipes`          | Bearer   | Create recipe           |
| GET    | `/api/recipes/stream`   | `?token` | SSE stream for recipes  |
| GET    | `/api/series`           | Bearer   | List all series         |
| POST   | `/api/series`           | Bearer   | Create series           |
| GET    | `/api/series/stream`    | `?token` | SSE stream for series   |
| GET    | `/api/activities`       | Bearer   | List all activities     |
| POST   | `/api/activities`       | Bearer   | Create activity         |
| GET    | `/api/activities/stream`| `?token` | SSE stream for activities|
| GET    | `/health`               | No       | Health check            |

## Production deployment

Build images on the Pi (`imagePullPolicy: Never`):

```bash
docker build -t nousdeux-frontend:latest --build-arg VITE_API_URL=http://<pi-tailscale-ip>:30080 .
docker build -f Dockerfile.api -t nousdeux-api:latest ./api
kubectl apply -f k8s/
```

Access via `http://<pi-tailscale-ip>:30080`.

### PWA install

- **iOS:** Safari > Share > "Zum Home-Bildschirm"
- **Android:** Chrome > Menu > "App installieren"

## Project structure

```
nousdeux/
├── api/
│   ├── main.go          # server setup, routes, shutdown
│   ├── auth.go          # login handler, JWT middleware
│   ├── handlers.go      # CRUD handlers for all 4 tables
│   ├── middleware.go     # CORS, JSON response helpers
│   ├── models.go        # Event, Recipe, Series, Activity structs
│   ├── store.go         # DB pool + SSE brokers
│   ├── db/
│   │   ├── connect.go   # pgx connection pool
│   │   ├── migrate.go   # auto-apply numbered SQL migrations
│   │   └── migrations/
│   │       └── 001_initial.sql
│   └── sse/
│       └── broker.go    # SSE fan-out broker
├── src/
│   ├── hooks/           # useEvents, useRecipes, useSeries, useActivities
│   ├── tabs/            # HomeTab, CalendarTab, ListsTab, RecipesTab, ActivitiesTab
│   ├── App.jsx          # tab routing, data wiring
│   ├── AuthGate.jsx     # login screen, JWT storage
│   ├── styles.js        # full design system as CSS template string
│   ├── data.js          # seed data + calendar grid
│   └── main.jsx         # entry point
├── k8s/                 # Kubernetes manifests
├── docker-compose.yml   # full local stack (Postgres + API + frontend)
├── Dockerfile           # frontend (node build → nginx)
├── Dockerfile.api       # API (go build → scratch)
└── PLAN.md              # development roadmap
```
