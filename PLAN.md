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

| Concern             | Choice                    | Why                                          |
| ------------------- | ------------------------- | -------------------------------------------- |
| Frontend            | Vite + React SPA          | Prototype is already this; no SSR needed     |
| Backend             | None                      | Supabase talks directly from the browser     |
| Database + Realtime | Supabase                  | Postgres, built-in real-time sync            |
| Auth                | Supabase magic link       | No passwords; sessions persist on phone      |
| PWA                 | vite-plugin-pwa           | Home screen install — avoids App Store       |
| Hosting             | Raspberry Pi (Kubernetes) | Self-hosted, no cloud costs                  |
| Network access      | Tailscale VPN             | Private access for both users, no public URL |

Total monthly cost: €0.

---

## Phased Roadmap

### Phase 1 — Working MVP ✅

- [x] Scaffold Vite project, split prototype into component files
- [x] Add PWA config + icons (`public/icon-192.png`, `public/icon-512.png`)
- [x] Build 4 data hooks (`useEvents`, `useRecipes`, `useSeries`, `useActivities`) backed by a mock in-memory server (`src/mock/db.js`)
- [x] Replace `useState(hardcodedData)` with the hooks in all tabs
- [x] Home tab stats driven by live data; greeting adapts to time of day
- [x] `.gitignore`, `Dockerfile`, `nginx.conf`, K8s manifests (`k8s/`)
- [ ] **Supabase: create project, define 4 tables** ← next when ready for real backend
- [ ] **Auth: `AuthGate` + magic link login** ← depends on Supabase
- [ ] **Supabase: Row-Level Security policies** ← depends on Supabase
- [ ] **Deploy to Pi, verify sync across two phones** ← depends on Supabase

The app runs and is fully navigable with mock data. Switching to the real backend only requires replacing the hook implementations in `src/hooks/` — no component changes needed.

### Phase 2 — Quality of Life

- Delete + edit items (currently add-only)
- Functional calendar (computed month grid, not hardcoded April 2026)
- Books and Movies tabs (currently empty placeholders)
- Auto-detect who's adding based on logged-in user (not hardcoded "M")

### Phase 3 — Nice to Have (later, if wanted)

- Push notifications ("Lena hat ein neues Rezept hinzugefügt")
- Recipe detail view with ingredients/steps
- Photo uploads for recipes (Supabase Storage)

---

## Current Project Structure

```
nosdeux/
├── public/
│   ├── icon.svg            # source icon (dark bg, nd monogram)
│   ├── icon-192.png        # PWA icon
│   └── icon-512.png        # PWA icon
├── src/
│   ├── mock/
│   │   └── db.js           # in-memory mock server (async, pub/sub)
│   ├── hooks/
│   │   ├── useEvents.js
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
│   ├── styles.js
│   ├── data.js             # seed data + April 2026 calendar layout
│   └── main.jsx
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml        # NodePort 30080
│   └── secret.yaml         # placeholder — do not commit real values
├── .env                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (gitignored)
├── .gitignore
├── Dockerfile              # multi-stage: node build → nginx serve
├── nginx.conf              # SPA fallback + asset caching
├── vite.config.js          # includes vite-plugin-pwa
├── index.html
└── package.json
```

---

## Connecting the Real Backend (next steps)

### 1 — Supabase tables

```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text,
  time text,
  who char(1) not null,
  badge text,
  badge_type text,
  created_at timestamptz default now()
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  emoji text,
  title text not null,
  tags text[],
  who char(1) not null,
  rating text default '–',
  created_at timestamptz default now()
);

create table series (
  id uuid primary key default gen_random_uuid(),
  emoji text,
  title text not null,
  sub text,
  progress int default 0,
  status text default 'Geplant',
  status_type text default 'yellow',
  created_at timestamptz default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  emoji text,
  title text not null,
  meta text,
  who char(1) not null,
  created_at timestamptz default now()
);
```

Row-Level Security policy (apply to all four tables, substitute real emails):

```sql
create policy "Only Max and Lena"
on events for all
using (
  auth.email() in ('max@example.com', 'lena@example.com')
);
```

### 2 — Swap mock hooks for Supabase

Install the client: `npm install @supabase/supabase-js`

Create `src/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Replace each hook's `mockDb` calls with Supabase. Example for events — the same pattern applies to all four:

```js
// src/hooks/useEvents.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useEvents() {
  const [events, setEvents] = useState([])

  const refresh = async () => {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    setEvents(data ?? [])
  }

  useEffect(() => {
    refresh()
    const channel = supabase.channel('events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, refresh)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const addEvent = (event) => supabase.from('events').insert(event)

  return { events, addEvent }
}
```

### 3 — Auth gate

```jsx
// src/AuthGate.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ALLOWED_EMAILS = ['max@example.com', 'lena@example.com']

export function AuthGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  if (session === undefined) return <div className="app">...</div>
  if (!session) return <LoginScreen />
  if (!ALLOWED_EMAILS.includes(session.user.email)) {
    supabase.auth.signOut()
    return <div>Kein Zugriff.</div>
  }

  return children
}
```

`LoginScreen` shows a single email input and calls `supabase.auth.signInWithOtp({ email })`. Session persists in localStorage — stays logged in on the phone indefinitely.

Wrap `<App />` with `<AuthGate>` in `src/main.jsx`.

### 4 — Deploy to Pi

`VITE_*` vars are baked into the bundle at build time by Vite, so pass them as Docker build args:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  -t nosdeux:latest .

kubectl apply -f k8s/
```

Access via `http://<pi-tailscale-ip>:30080`. Open in Safari/Chrome and "Add to Home Screen" to install the PWA.

---

## PWA Install Instructions

**iOS:** Safari → Share button → "Zum Home-Bildschirm hinzufügen"  
**Android:** Chrome shows an automatic "App installieren" banner, or use the menu → "App installieren"
