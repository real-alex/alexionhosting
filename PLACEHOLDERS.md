# Placeholders — what you still need to provide

This repo is a complete, runnable scaffold. To take it from "runs with a
simulator" to "real product", fill in the items below. Nothing here blocks local
development with the dev simulator.

## 1. Supabase (required to log in)

- [ ] Create a Supabase project.
- [ ] Run `supabase/migrations/0001_init.sql` and `0002_seed_local_node.sql`.
- [ ] Put the URL + keys in `.env` (see `.env.example` / `supabase/README.md`):
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
    `SUPABASE_JWT_SECRET`, and the matching `NEXT_PUBLIC_*` values.

## 2. Secrets

- [ ] `AGENT_TOKEN` — a long random string shared by the API and agent
      (`openssl rand -hex 32`). The same value must be set for both.
- [ ] `GAME_DB_ROOT_PASSWORD` — MariaDB root password if you use game databases.

## 3. Real game-server binaries (required for real servers)

The platform runs a **dev simulator** until you provide these. They are
proprietary and intentionally git-ignored.

- [ ] SA-MP: drop `samp03svr` + gamemodes into
      `templates/samp/server-files/` (see its README).
- [ ] CRMP: drop `crmp-server` + files into `templates/crmp/server-files/`.
- [ ] Uncomment the i386 runtime-library block in each `Dockerfile`.

> The README mentions original `CRMP` and `SAMP` folders as the official default
> game files — copy those binaries/gamemodes into the matching `server-files/`.

## 4. Branding

- [ ] Add `logo.svg`, `logo-mark.svg`, `favicon.ico`, `og-image.png` to
      `apps/web/public/brand/` (see its README). Until then a placeholder
      monogram is shown.
- [ ] Optionally set `NEXT_PUBLIC_SITE_NAME` in `.env`.

## 5. Infrastructure / hosting (for production)

- [ ] A host (node) with Docker for the agent; set `nodes.agent_base_url` and
      `nodes.public_host` to reachable addresses.
- [ ] A public IP / DNS and an open **UDP** port range
      (`GAME_PORT_RANGE_START`–`END`) for game traffic.
- [ ] TLS termination / reverse proxy for the web + API (e.g. Nginx, Caddy).
- [ ] Decide where to deploy web + API (Vercel, Fly.io, a VPS, …).

## 6. Not built yet (see `docs/PHASES.md`)

- [ ] Billing (Stripe), plans, and suspend-on-nonpayment.
- [ ] File manager + backups + per-server database provisioning.
- [ ] Admin area, node heartbeats, ESLint/test/CI wiring.
