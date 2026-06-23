'use client';

import { useEffect, useRef, useState } from 'react';
import type { LogLine, ServerConsoleResponse } from '@alexion/shared';

export function ConsoleView({ serverId }: { serverId: string }) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/servers/${serverId}/console`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as ServerConsoleResponse;
        if (active) {
          setLines(data.lines ?? []);
          setConnected(true);
        }
      } catch {
        if (active) setConnected(false);
      }
    }

    void poll();
    const timer = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [serverId]);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Console</h2>
        <span className={`text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
          {connected ? '● live' : '● disconnected'}
        </span>
      </div>
      <div
        ref={boxRef}
        className="h-80 overflow-y-auto rounded-lg border border-ink-600 bg-black/60 p-3 font-mono text-xs leading-relaxed text-slate-300"
      >
        {lines.length === 0 ? (
          <p className="text-slate-500">No console output yet. Start the server to see logs.</p>
        ) : (
          lines.map((line, idx) => (
            <div key={`${line.timestamp}-${idx}`} className="whitespace-pre-wrap break-all">
              <span className="text-slate-600">
                {new Date(line.timestamp).toLocaleTimeString()}{' '}
              </span>
              {line.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
