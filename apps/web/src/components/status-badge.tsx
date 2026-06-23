import { ServerStatus } from '@alexion/shared';

const STYLES: Record<string, string> = {
  [ServerStatus.RUNNING]: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  [ServerStatus.STARTING]: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  [ServerStatus.RESTARTING]: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  [ServerStatus.STOPPING]: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  [ServerStatus.PROVISIONING]: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  [ServerStatus.DELETING]: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  [ServerStatus.STOPPED]: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  [ServerStatus.SUSPENDED]: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
  [ServerStatus.ERROR]: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

const LABELS: Record<string, string> = {
  [ServerStatus.RUNNING]: 'Running',
  [ServerStatus.STARTING]: 'Starting',
  [ServerStatus.RESTARTING]: 'Restarting',
  [ServerStatus.STOPPING]: 'Stopping',
  [ServerStatus.PROVISIONING]: 'Provisioning',
  [ServerStatus.DELETING]: 'Deleting',
  [ServerStatus.STOPPED]: 'Stopped',
  [ServerStatus.SUSPENDED]: 'Suspended',
  [ServerStatus.ERROR]: 'Error',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES[ServerStatus.STOPPED];
  const label = LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
