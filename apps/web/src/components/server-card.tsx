import Link from 'next/link';
import { SERVER_TYPE_LABEL, type ServerView } from '@alexion/shared';
import { StatusBadge } from './status-badge';

export function ServerCard({ server }: { server: ServerView }) {
  const players = server.runtime?.players;
  return (
    <Link
      href={`/servers/${server.id}`}
      className="card block transition hover:border-brand-500/60 hover:bg-ink-700/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{server.name}</h3>
          <p className="text-sm text-slate-400">{SERVER_TYPE_LABEL[server.type]}</p>
        </div>
        <StatusBadge status={server.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Address</dt>
          <dd className="font-mono text-slate-200">
            {server.host}:{server.port}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Players</dt>
          <dd className="text-slate-200">
            {players ?? '—'} / {server.resources.maxPlayers}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
