import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SERVER_TYPE_LABEL, type ServerDetailResponse } from '@alexion/shared';
import { ConsoleView } from '@/components/console-view';
import { ServerControls } from '@/components/server-controls';
import { StatusBadge } from '@/components/status-badge';
import { ApiRequestError, apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

function formatUptime(seconds: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default async function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let server: ServerDetailResponse['server'];
  try {
    const data = await apiFetch<ServerDetailResponse>(`/servers/${id}`);
    server = data.server;
  } catch (err) {
    if (err instanceof ApiRequestError && (err.status === 404 || err.status === 403)) {
      notFound();
    }
    throw err;
  }

  const runtime = server.runtime;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Back to servers
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{server.name}</h1>
          <StatusBadge status={server.status} />
          <span className="text-sm text-slate-400">{SERVER_TYPE_LABEL[server.type]}</span>
        </div>
      </div>

      <div className="card">
        <ServerControls server={server} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Connection
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Address" value={`${server.host}:${server.port}`} mono />
            <Row label="RCON password" value={server.rconPassword} mono />
            <Row
              label="Players"
              value={`${runtime?.players ?? '—'} / ${server.resources.maxPlayers}`}
            />
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Resources
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Memory" value={`${server.resources.memoryMb} MB`} />
            <Row label="CPU" value={`${server.resources.cpuCores} core(s)`} />
            <Row label="Disk" value={`${server.resources.diskMb} MB`} />
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Live stats
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Uptime" value={formatUptime(runtime?.uptimeSeconds ?? null)} />
            <Row
              label="CPU usage"
              value={runtime?.cpuPercent != null ? `${(runtime.cpuPercent * 100).toFixed(0)}%` : '—'}
            />
            <Row
              label="Memory usage"
              value={runtime?.memoryMb != null ? `${runtime.memoryMb} MB` : '—'}
            />
          </dl>
        </div>
      </div>

      <div className="card">
        <ConsoleView serverId={server.id} />
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={mono ? 'font-mono text-slate-200' : 'text-slate-200'}>{value}</dd>
    </div>
  );
}
