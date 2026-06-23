'use client';

import { useState, useTransition } from 'react';
import { SERVER_TYPE_LABEL, ServerType } from '@alexion/shared';
import { createServerAction } from '@/app/(dashboard)/servers/actions';

export function CreateServerForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<ServerType>(ServerType.SAMP);
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [memoryMb, setMemoryMb] = useState(1024);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createServerAction({ name, type, maxPlayers, memoryMb });
      if (res?.error) {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="name">
          Server name
        </label>
        <input
          id="name"
          className="input"
          required
          minLength={3}
          maxLength={32}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Roleplay Server"
        />
      </div>

      <div>
        <span className="label">Game type</span>
        <div className="grid grid-cols-2 gap-3">
          {(Object.values(ServerType) as ServerType[]).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setType(value)}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
                type === value
                  ? 'border-brand-500 bg-brand-600/20 text-white'
                  : 'border-ink-600 bg-ink-900/40 text-slate-300 hover:border-ink-500'
              }`}
            >
              {SERVER_TYPE_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="maxPlayers">
            Max players
          </label>
          <input
            id="maxPlayers"
            type="number"
            className="input"
            min={8}
            max={1000}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label" htmlFor="memoryMb">
            Memory (MB)
          </label>
          <input
            id="memoryMb"
            type="number"
            className="input"
            min={256}
            max={8192}
            step={256}
            value={memoryMb}
            onChange={(e) => setMemoryMb(Number(e.target.value))}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? 'Provisioning…' : 'Create server'}
      </button>
    </form>
  );
}
