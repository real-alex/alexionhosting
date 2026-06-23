-- Alexion Hosting — initial platform schema.
-- Run this in your Supabase project (SQL editor or `supabase db push`).

-- ---------------------------------------------------------------------------
-- profiles: augments Supabase auth.users with platform fields (role, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  role         text not null default 'customer' check (role in ('customer', 'admin')),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- nodes: hosts running the Alexion agent that run game-server containers.
-- ---------------------------------------------------------------------------
create table if not exists public.nodes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  region              text not null default 'local',
  agent_base_url      text not null,
  status              text not null default 'offline' check (status in ('online', 'offline', 'draining')),
  public_host         text not null default '127.0.0.1',
  capacity_memory_mb  integer not null default 8192,
  allocated_memory_mb integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- servers: one row per customer game server.
-- ---------------------------------------------------------------------------
create table if not exists public.servers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  type          text not null check (type in ('samp', 'crmp')),
  status        text not null default 'provisioning',
  node_id       uuid not null references public.nodes (id),
  container_id  text,
  host          text not null,
  port          integer not null,
  query_port    integer not null,
  rcon_password text not null,
  cpu_cores     numeric not null default 1,
  memory_mb     integer not null default 1024,
  disk_mb       integer not null default 5120,
  max_players   integer not null default 50,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (node_id, port)
);

create index if not exists servers_owner_idx on public.servers (owner_id);
create index if not exists servers_node_idx on public.servers (node_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile whenever a new auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security.
-- The API uses the service-role key (which bypasses RLS), so these policies
-- are defense-in-depth for any direct anon/auth access from the browser.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.servers enable row level security;
alter table public.nodes enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "servers_select_own" on public.servers
  for select using (auth.uid() = owner_id);

-- nodes: no anon/auth policies — only the service role may read/write them.
