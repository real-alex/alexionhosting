-- Seed a single local node so you can provision servers immediately in dev.
-- Update agent_base_url / public_host to match your deployment.
insert into public.nodes (name, region, agent_base_url, status, public_host, capacity_memory_mb)
select 'local-node-1', 'local', 'http://localhost:5000', 'online', '127.0.0.1', 16384
where not exists (
  select 1 from public.nodes where name = 'local-node-1'
);
