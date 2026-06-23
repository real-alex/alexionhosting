# Architecture

Alexion Hosting is a monorepo with three runnable apps and one shared package.

```
                ┌─────────────────────────┐
                │   Browser (customer)     │
                └───────────┬─────────────┘
                            │  HTTPS + Supabase session cookie
                ┌───────────▼─────────────┐
                │  apps/web  (Next.js)     │   the dashboard
                │  - Supabase Auth (login) │
                │  - Server actions / API  │
                └───────────┬─────────────┘
                            │  Bearer = Supabase access token
                ┌───────────▼─────────────┐        ┌────────────────────┐
                │  apps/api  (NestJS)      │◄──────►│ Supabase Postgres  │
                │  the "brain"             │        │ profiles / nodes / │
                │  - verifies JWT          │        │ servers            │
                │  - owns data + ports     │        └────────────────────┘
                │  - orchestrates nodes    │
                └───────────┬─────────────┘
                            │  Bearer = AGENT_TOKEN (shared secret)
                ┌───────────▼─────────────┐
                │  apps/agent  (Node)      │   the "muscle", one per host
                │  - Docker provisioning   │
                │  - start/stop/logs/stats │
                └───────────┬─────────────┘
                            │  Docker Engine API
                ┌───────────▼─────────────┐
                │  Game-server containers  │   built from templates/
                │  (SA-MP / CRMP)          │
                └─────────────────────────┘
```

## Responsibilities

### `apps/web` — dashboard (Next.js, App Router)
The only thing customers see. Handles login/signup with **Supabase Auth**, then
calls the API server-side, forwarding the user's Supabase access token as a
bearer credential. Server Actions perform create/start/stop/restart/delete; a
small route handler proxies the live console for client-side polling.

### `apps/api` — central API (NestJS)
The brain. It:
- Verifies the Supabase-issued JWT on every request (`SupabaseAuthGuard`).
- Owns all platform data in Supabase Postgres (via the service-role client).
- Picks a node, allocates a free UDP port, generates an RCON password.
- Calls the right node's agent to provision/control containers.
- Never talks to Docker directly — that's the agent's job.

### `apps/agent` — node agent (Node + Express + dockerode)
The muscle, deployed once per host ("node"). It:
- Builds the per-type image from `templates/` on first use.
- Creates/starts/stops/restarts/kills/removes containers.
- Streams console logs and samples CPU/memory.
- Is authenticated only by the shared `AGENT_TOKEN`; it trusts the API.

### `packages/shared`
Domain models (`GameServer`, `HostNode`, `UserProfile`) and the HTTP contracts
for web↔API and API↔agent. Single source of truth imported by all three apps.

### `templates/`
One Docker build context per game type. Each bundles a dev **simulator** so the
platform runs without proprietary binaries; drop the real `samp03svr` /
`crmp-server` in to host actual servers.

## Key flows

**Create a server**
1. Dashboard → `POST /api/servers` (Server Action).
2. API picks a node, allocates a port, writes a `provisioning` row.
3. API → agent `POST /servers` → agent builds image (if needed) + creates the container.
4. API marks the server `stopped` and records the container id.

**Start / stop / restart**
1. Dashboard → `POST /api/servers/:id/actions`.
2. API verifies ownership, sets a transitional status, calls the agent.
3. Agent runs the Docker action and reports runtime state back.

**Live console**
- Client polls `/api/servers/:id/console` (Next route handler) every 4s.
- That handler → API `GET /api/servers/:id/console` → agent `GET /servers/:id/logs`.

## Per-server game databases (MariaDB/MySQL)
SA-MP/CRMP gamemodes that need SQL get an isolated database. `infra/` provides a
local MariaDB for development; provisioning a database per server is a Phase-3
task (see `docs/PHASES.md`).
