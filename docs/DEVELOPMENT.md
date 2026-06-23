# Local development

## Prerequisites

- **Node.js 20+** (this repo is tested on 22; see `.nvmrc`)
- **pnpm 9+** (`npm install -g pnpm`)
- **Docker** running locally (the agent provisions containers through it)
- A free **Supabase** project (https://supabase.com)

## 1. Install dependencies

```bash
pnpm install
pnpm build:shared   # build @alexion/shared once so the apps can import it
```

## 2. Set up Supabase

1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` then
   `supabase/migrations/0002_seed_local_node.sql` (see `supabase/README.md`).
3. From **Project Settings → API**, copy the URL, anon key, service-role key,
   and JWT secret.

## 3. Configure environment

```bash
cp .env.example .env
# Generate a strong shared secret for the API ↔ agent link:
openssl rand -hex 32   # paste into AGENT_TOKEN
```

Fill in the Supabase values in `.env`. All three apps read this single root
`.env` (the web app also reads `NEXT_PUBLIC_*` from it).

## 4. Run everything

```bash
pnpm dev
```

Turborepo starts all apps in parallel:

| App   | URL                     | Notes                              |
| ----- | ----------------------- | ---------------------------------- |
| web   | http://localhost:3000   | the dashboard                      |
| api   | http://localhost:4000   | `GET /api/health` to sanity-check  |
| agent | http://localhost:5000   | `GET /ping` (no auth) to check up  |

Or run one at a time:

```bash
pnpm --filter @alexion/api dev
pnpm --filter @alexion/agent dev
pnpm --filter @alexion/web dev
```

## 5. Try it

1. Open http://localhost:3000 and **sign up**.
2. Create a server (SA-MP or CRMP). The agent builds the image on first use
   (this pulls a Node base image once) and creates the container.
3. Click **Start** and watch the live console — the dev simulator prints a
   realistic SA-MP-style console and "players" joining/leaving.
4. Stop / restart / delete to exercise the full lifecycle.

> No real game binaries needed yet — the simulator stands in. To host real
> servers, see `templates/samp/server-files/README.md`.

## Useful commands

```bash
pnpm build        # build all apps (Turbo orders @alexion/shared first)
pnpm typecheck    # type-check every package
pnpm format       # Prettier write
pnpm --filter @alexion/agent build && node apps/agent/dist/main.js
```

## Per-server MariaDB (optional, for SQL gamemodes)

```bash
docker compose -f infra/docker-compose.yml up -d mariadb
```

This starts a local MariaDB on `localhost:3306` using the `GAME_DB_*` values in
`.env`. Automatic per-server database provisioning is a Phase-3 item.

## Troubleshooting

- **"Supabase isn't configured"** on the dashboard → `.env` is missing the
  `NEXT_PUBLIC_SUPABASE_*` values; restart `pnpm dev` after editing `.env`.
- **Agent: "Docker is not reachable"** → make sure Docker is running and, if
  needed, set `DOCKER_SOCKET` (default `/var/run/docker.sock`).
- **"No node currently has capacity"** → run the seed migration, or check that
  `nodes.status = 'online'` and `agent_base_url` points at your agent.
- **401 from the API** → the web app couldn't attach a session; sign out and in
  again, and confirm `SUPABASE_JWT_SECRET` matches your project.
