# nousdeux

A shared planning PWA for two users to manage events, recipes, TV series, and activities. German-language UI, self-hosted on a Raspberry Pi via Kubernetes, accessed privately over Tailscale.

![alt text](res/homescreen.png)

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

Docker Compose runs the **backend** (Postgres + API); the frontend service is
currently commented out in `docker-compose.yml` — run it via `npm run dev`
(see below).

```bash
# Generate a bcrypt hash for a test password
htpasswd -nbBC 12 "" test | cut -d: -f2

# Create .env with the required variables
cat > .env <<'EOF'
POSTGRES_USER=nousdeux
POSTGRES_PASSWORD=nousdeux
POSTGRES_DB=nousdeux
JWT_SECRET=dev-secret
USERS={"max":"<paste-hash>","lena":"<paste-hash>"}
EOF

# Start Postgres + API
docker compose up --build
```

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

| Variable              | Required | Description                                                        |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `DB_DSN`              | Yes      | Postgres connection string                                          |
| `API_ADDR`            | No       | Listen address (default `:8080`)                                    |
| `JWT_SECRET`          | Yes      | Secret key for signing JWTs                                         |
| `USERS`               | Yes      | JSON map of `username` to bcrypt hash (seeded into DB on startup)   |
| `ADMINS`              | No       | Comma/space-separated usernames with admin rights                   |
| `ATTACHMENTS_DIR`     | No       | Event attachment storage dir (default `/data/attachments`)          |
| `UNSPLASH_ACCESS_KEY` | No       | Recipe image auto-fetch; skipped when unset                         |
| `TMDB_API_KEY`        | No       | Movie/series poster auto-fetch; skipped when unset                  |
| `ANTHROPIC_API_KEY`   | No       | AI recipe import (`/api/recipes/import`); 503 when unset            |

### Schema migrations

SQL migrations live in `api/db/migrations/` as numbered files. They are embedded into the binary and run automatically on startup. See [CLAUDE.md](CLAUDE.md) for the full workflow.

### API endpoints

All routes except `/health` and `/api/login` require a Bearer token (or
`?token=` query parameter, used by EventSource for the SSE streams).

| Method               | Path                              | Description                                        |
| -------------------- | --------------------------------- | -------------------------------------------------- |
| POST                 | `/api/login`                      | Returns signed JWT                                  |
| POST                 | `/api/me/password`                | Change own password                                 |
| GET/POST/PATCH/DELETE | `/api/events`                    | CRUD for events                                     |
| GET/POST/PATCH/DELETE | `/api/recipes`                   | CRUD for recipes                                    |
| GET/POST/PATCH/DELETE | `/api/series`                    | CRUD for series                                     |
| GET/POST/PATCH/DELETE | `/api/movies`                    | CRUD for movies                                     |
| GET/POST/PATCH/DELETE | `/api/activities`                | CRUD for activities                                 |
| GET                  | `/api/{resource}/stream`          | SSE stream (events, recipes, series, movies, activities, shopping) |
| GET/POST/PATCH/DELETE | `/api/shopping`                  | Shopping list items                                 |
| GET                  | `/api/shopping/history`           | Previously used item names (autocomplete)           |
| POST                 | `/api/recipes/import`             | AI recipe import from a URL (Anthropic API)         |
| GET/PATCH            | `/api/recipes/image`              | Search/set recipe image (Unsplash)                  |
| POST                 | `/api/recipes/{id}/upload-image`  | Upload a recipe image                               |
| GET                  | `/api/recipes/{id}/image-file`    | Serve uploaded recipe image (no auth)               |
| GET/PATCH            | `/api/series/image`               | Search/set series poster (TMDB)                     |
| GET/PATCH            | `/api/movies/image`               | Search/set movie poster (TMDB)                      |
| GET/POST             | `/api/events/{id}/attachments`    | List/upload event attachments                       |
| GET/DELETE           | `/api/attachments/{id}`           | Download/delete an attachment                       |
| GET                  | `/api/weather`                    | Weather forecast proxy                              |
| GET/PATCH            | `/api/settings`                   | App settings (PATCH is admin-only)                  |
| GET                  | `/health`                         | Health check (no auth)                              |

## Production deployment

Build images on the Pi:

```bash
docker build -t nousdeux-frontend:latest --build-arg VITE_API_URL=http://<pi-tailscale-ip>:30080 .
docker build -f Dockerfile.api -t nousdeux-api:latest ./api
```

Access via `http://<pi-tailscale-ip>:30080`.

### PWA install

- **iOS:** Safari > Share > "Zum Home-Bildschirm"
- **Android:** Chrome > Menu > "App installieren"

## Project structure

```
nousdeux/
├── api/
│   ├── main.go            # server setup, routes, shutdown
│   ├── auth.go            # login, password change, JWT middleware, user seeding
│   ├── handlers.go        # CRUD handlers for events/recipes/series/movies/activities + shopping
│   ├── attachments.go     # event attachment upload/download/delete
│   ├── recipe_import.go   # AI recipe import (Anthropic API)
│   ├── recipe_images.go   # recipe image upload + serving
│   ├── list_images.go     # TMDB poster search for series/movies
│   ├── weather.go         # weather forecast proxy
│   ├── settings.go        # app settings (admin-gated writes)
│   ├── cleanup.go         # background cleanup worker
│   ├── middleware.go      # CORS, JSON response helpers
│   ├── models.go          # Event, Recipe, Series, Movie, Activity structs
│   ├── store.go           # DB pool + SSE brokers
│   ├── validate.go        # input validation helpers
│   ├── *_test.go          # handler, validation, weather, attachment tests
│   ├── VERSION            # API semver (Docker image tag source)
│   ├── db/
│   │   ├── connect.go     # pgx connection pool
│   │   ├── migrate.go     # auto-apply numbered SQL migrations
│   │   └── migrations/    # 001_initial … 018_list_image_url
│   └── sse/
│       └── broker.go      # SSE fan-out broker
├── src/
│   ├── hooks/             # data hooks (events, recipes, series, movies, activities,
│   │                      #   shopping list, settings, weather) + api.js + connectStream.js
│   ├── tabs/              # HomeTab, CalendarTab, ListsTab, RecipesTab
│   ├── components/        # Sheet, EmptyState, Icons, TagInput, PasswordChange
│   ├── context/           # ToastContext (undo toasts)
│   ├── styles/            # design system as CSS template strings, split by area
│   ├── utils/             # authorColor and other helpers
│   ├── App.jsx            # tab routing, data wiring, profile modal
│   ├── AuthGate.jsx       # login screen, JWT storage
│   ├── parseJwt.js        # decode JWT claims client-side
│   └── main.jsx           # entry point
├── docs/                  # feature design notes
├── docker-compose.yml     # local backend stack (Postgres + API; frontend commented out)
├── nginx.conf             # nginx config for frontend container
├── Dockerfile             # frontend (node build → nginx)
├── Dockerfile.api         # API (go build → scratch)
├── CHANGELOG.md           # frontend release history
└── TODO.md                # working plan (refactoring, tests, features)
```
