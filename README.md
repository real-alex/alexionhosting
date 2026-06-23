# Alexion Hosting

A full-stack **CRMP** and **SA-MP** game-server hosting platform. Customers sign
up, create isolated Dockerized game servers, and control them — start/stop/
restart, live console, resource stats — from one dashboard.

> **Status:** runnable end-to-end today using a built-in dev simulator, so you
> can develop the whole platform before adding the (proprietary) real game
> binaries. See [`PLACEHOLDERS.md`](./PLACEHOLDERS.md) and
> [`docs/PHASES.md`](./docs/PHASES.md).

## Stack

| Part            | Tech                                   | Folder          |
| --------------- | -------------------------------------- | --------------- |
| Dashboard       | Next.js 15 (App Router) + Supabase Auth| `apps/web`      |
| Central API     | NestJS 10                              | `apps/api`      |
| Node agent      | Node + Express + dockerode             | `apps/agent`    |
| Shared contract | TypeScript types/DTOs                   | `packages/shared` |
| Platform data   | Supabase Postgres                      | `supabase/`     |
| Game servers    | Docker (SA-MP / CRMP templates)        | `templates/`    |
| Game databases  | MariaDB/MySQL                          | `infra/`        |

Monorepo managed with **pnpm workspaces** + **Turborepo**.

## How it fits together

```
Browser → apps/web (dashboard) → apps/api (brain) → apps/agent (muscle) → Docker
                                       │
                                 Supabase Postgres
```

The **API** owns data and decisions (auth, ownership, port allocation); the
**agent** is the only thing that touches Docker. Full diagram in
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Quickstart

```bash
pnpm install
pnpm build:shared

# configure Supabase + secrets
cp .env.example .env        # then fill in the values
#   - run the SQL in supabase/migrations/ in your Supabase project
#   - set AGENT_TOKEN to `openssl rand -hex 32`

pnpm dev                    # web :3000, api :4000, agent :5000
```

Open http://localhost:3000, sign up, and create a server. Full walkthrough:
[`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).

## Repository layout

```
apps/
  web/      Next.js dashboard (customer + admin)
  api/      NestJS central API
  agent/    Node agent — Docker provisioning & control
packages/
  shared/   shared domain types + HTTP contracts
templates/
  samp/     SA-MP server image (Dockerfile + dev simulator)
  crmp/     CRMP server image (Dockerfile + dev simulator)
supabase/   SQL schema + migrations
infra/      local docker-compose (MariaDB)
docs/       architecture, phases, development guide
```

## Scripts

| Command          | What it does                          |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Run all apps in watch mode            |
| `pnpm build`     | Build everything (shared first)       |
| `pnpm typecheck` | Type-check all packages               |
| `pnpm format`    | Prettier write                        |

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the pieces talk.
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — run it locally.
- [`docs/PHASES.md`](./docs/PHASES.md) — what's done and what's next.
- [`PLACEHOLDERS.md`](./PLACEHOLDERS.md) — what you must provide.
