import { NextResponse } from 'next/server';
import type { ServerConsoleResponse } from '@alexion/shared';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Proxies the live console from the central API, attaching the user's token. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await apiFetch<ServerConsoleResponse>(`/servers/${id}/console`);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { serverId: id, status: 'error', lines: [] } satisfies ServerConsoleResponse,
      { status: 200 },
    );
  }
}
