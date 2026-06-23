# Supabase / platform database

The platform stores its data (profiles, nodes, servers) in Supabase Postgres and
uses Supabase Auth for login.

## Apply the schema

Either paste the SQL files into the Supabase **SQL Editor** in order, or use the
Supabase CLI:

```bash
# from the repo root, with the Supabase CLI installed and linked to your project
supabase db push
```

Files (run in order):

1. `migrations/0001_init.sql` — tables, the new-user trigger, and RLS policies.
2. `migrations/0002_seed_local_node.sql` — a `local-node-1` row pointing at the
   agent on `http://localhost:5000`. Edit it to match where your agent runs.

## Make yourself an admin

After signing up once, promote your user in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Where the keys go

Copy these from **Project Settings → API** into your root `.env`
(see `.env.example`):

- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never expose to the browser)
- `SUPABASE_JWT_SECRET` (Project Settings → API → JWT Secret)
