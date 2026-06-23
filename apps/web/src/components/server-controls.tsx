'use client';

import { useState, useTransition } from 'react';
import { ServerAction, ServerStatus, type ServerView } from '@alexion/shared';
import { deleteServerAction, runServerActionById } from '@/app/(dashboard)/servers/actions';

export function ServerControls({ server }: { server: ServerView }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isRunning = server.status === ServerStatus.RUNNING;
  const isBusy =
    pending ||
    server.status === ServerStatus.STARTING ||
    server.status === ServerStatus.STOPPING ||
    server.status === ServerStatus.RESTARTING ||
    server.status === ServerStatus.PROVISIONING ||
    server.status === ServerStatus.DELETING;

  function run(action: ServerAction) {
    setError(null);
    startTransition(async () => {
      const res = await runServerActionById(server.id, action);
      if (res?.error) setError(res.error);
    });
  }

  function onDelete() {
    if (!window.confirm('Delete this server? This removes the container and all its data.')) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteServerAction(server.id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary"
          disabled={isBusy || isRunning}
          onClick={() => run(ServerAction.START)}
        >
          Start
        </button>
        <button
          className="btn-ghost"
          disabled={isBusy || !isRunning}
          onClick={() => run(ServerAction.STOP)}
        >
          Stop
        </button>
        <button
          className="btn-ghost"
          disabled={isBusy || !isRunning}
          onClick={() => run(ServerAction.RESTART)}
        >
          Restart
        </button>
        <button className="btn-danger ml-auto" disabled={isBusy} onClick={onDelete}>
          Delete
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
