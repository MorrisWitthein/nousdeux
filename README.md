# nosdeux

A shared planning PWA for two users to manage events, recipes, TV series, and activities. German-language UI, self-hosted on a Raspberry Pi via Kubernetes, accessed privately over Tailscale.

## Stack

| Layer    | Tech                          |
| -------- | ----------------------------- |
| Frontend | React 18 + Vite 6 (JSX, PWA) |
| API      | Go (stdlib net/http)          |
| Realtime | Server-Sent Events (SSE)      |
| Auth     | JWT (bcrypt passwords)        |
| Hosting  | Raspberry Pi + Kubernetes     |
| Network  | Tailscale VPN                 |

## Local development

### Prerequisites

- Node.js 18+
- Go 1.22+

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

Or if you don't have `htpasswd`, use the Go toolchain:

```bash
echo 'package main; import ("fmt";"golang.org/x/crypto/bcrypt"); func main() { h, _ := bcrypt.GenerateFromPassword([]byte("test"), 12); fmt.Println(string(h)) }' > /tmp/bgen.go && go run -C api /tmp/bgen.go
```

Start the API (from `api/`):

```bash
JWT_SECRET=dev-secret \
USERS='{"max":"<paste-hash>","lena":"<paste-hash>"}' \
go run .
```

The API listens on `http://localhost:8080`. Both users can log in with password `test`.

### API environment variables

| Variable     | Required | Description                                         |
| ------------ | -------- | --------------------------------------------------- |
| `API_ADDR`   | No       | Listen address (default `:8080`)                    |
| `JWT_SECRET` | Yes      | Secret key for signing JWTs                         |
| `USERS`      | Yes      | JSON map of `username` to bcrypt hash               |

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
docker build -t nosdeux-frontend:latest .
docker build -f Dockerfile.api -t nosdeux-api:latest ./api
kubectl apply -f k8s/
```

Access via `http://<pi-tailscale-ip>:30080`.

### PWA install

- **iOS:** Safari > Share > "Zum Home-Bildschirm"
- **Android:** Chrome > Menu > "App installieren"

## Project structure

```
nosdeux/
├── api/
│   ├── main.go          # server setup, routes, shutdown
│   ├── auth.go          # login handler, JWT middleware
│   ├── handlers.go      # CRUD handlers for all 4 tables
│   ├── middleware.go     # CORS, JSON response helpers
│   ├── models.go        # Event, Recipe, Series, Activity structs
│   ├── store.go         # in-memory data + SSE brokers
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
├── Dockerfile           # frontend (node build > nginx)
├── Dockerfile.api       # API (go build > distroless)
└── PLAN.md              # development roadmap
```
