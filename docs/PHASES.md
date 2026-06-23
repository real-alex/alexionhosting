# Build phases

A phase-by-phase plan. ✅ = implemented in this repo, 🚧 = partially, ⬜ = planned.

## Phase 0 — Project base ✅
- ✅ pnpm + Turborepo monorepo, shared TS config, Prettier.
- ✅ `packages/shared` domain models + web/API/agent contracts.
- ✅ `.env.example`, docs, templates scaffolding, Supabase schema.

## Phase 1 — Auth & dashboard shell ✅
- ✅ Supabase Auth (email/password) sign-in/sign-up.
- ✅ Protected dashboard layout; `GET /api/auth/me` profile endpoint.
- ✅ Profiles table + auto-provision trigger + lazy creation in the API.
- ⬜ OAuth providers (Google/Discord), email verification UX polish.

## Phase 2 — Server provisioning ✅ (core)
- ✅ Node model + node selection + UDP port allocation.
- ✅ Agent: build image from template, create/start/stop/restart/kill/remove.
- ✅ Create/list/detail servers; start/stop/restart/delete from the dashboard.
- ✅ Live console (log streaming via polling) + CPU/memory stats.
- ✅ Dev simulator so it all works without proprietary game binaries.
- 🚧 Real SA-MP/CRMP binaries (operator-provided; templates are ready).
- ⬜ WebSocket console + RCON command input (currently read-only polling).

## Phase 3 — Game databases & files ⬜
- ⬜ Provision a MariaDB database + user per server that needs SQL.
- ⬜ File manager API (list/read/write/upload) over the server data volume.
- ⬜ Scheduled + on-demand backups (archive the data volume) and restore.

## Phase 4 — Billing & plans ⬜
- ⬜ Plans/resource tiers, Stripe checkout + webhooks.
- ⬜ Suspend/unsuspend servers on payment state (status `suspended` exists).
- ⬜ Usage metering and invoices.

## Phase 5 — Admin & operations ⬜
- ⬜ Admin area (all servers/users/nodes; role already modeled).
- ⬜ Node registration + heartbeat dashboard; auto-drain unhealthy nodes.
- ⬜ Centralized logging/metrics, alerting.

## Phase 6 — Hardening & scale ⬜
- ⬜ Rate limiting, audit log, secrets rotation for `AGENT_TOKEN`.
- ⬜ Multi-node scheduling, image registry, zero-downtime agent upgrades.
- ⬜ E2E tests + CI pipeline.

## Cross-cutting follow-ups
- ⬜ ESLint configs wired across packages (lint scripts are placeholders today).
- ⬜ Unit/integration tests (`test` task is wired in Turbo, suites TBD).
- ⬜ DDoS protection / firewall in front of game ports.
