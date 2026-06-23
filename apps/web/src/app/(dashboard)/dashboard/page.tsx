import Link from 'next/link';
import type { ServerListResponse, ServerView } from '@alexion/shared';
import { ServerCard } from '@/components/server-card';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let servers: ServerView[] = [];
  let error: string | null = null;
  try {
    const data = await apiFetch<ServerListResponse>('/servers');
    servers = data.servers;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Could not load servers';
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your servers</h1>
          <p className="text-sm text-slate-400">Manage your CRMP &amp; SA-MP game servers.</p>
        </div>
        <Link href="/servers/new" className="btn-primary">
          + New server
        </Link>
      </div>

      {error && (
        <div className="card border-red-500/40 bg-red-500/5 text-red-300">
          <p className="font-medium">Couldn&apos;t reach the API</p>
          <p className="text-sm text-red-300/80">{error}</p>
        </div>
      )}

      {!error && servers.length === 0 && (
        <div className="card text-center">
          <p className="text-lg font-medium text-white">No servers yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Create your first game server to get started.
          </p>
          <Link href="/servers/new" className="btn-primary mt-4">
            Create a server
          </Link>
        </div>
      )}

      {servers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}
