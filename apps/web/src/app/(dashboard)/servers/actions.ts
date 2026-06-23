'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ServerAction, ServerDetailResponse, ServerType } from '@alexion/shared';
import { apiFetch } from '@/lib/api';

type ActionError = { error: string };

function toError(err: unknown, fallback: string): ActionError {
  return { error: err instanceof Error ? err.message : fallback };
}

export async function createServerAction(input: {
  name: string;
  type: ServerType;
  memoryMb?: number;
  maxPlayers?: number;
}): Promise<ActionError | void> {
  let createdId: string;
  try {
    const res = await apiFetch<ServerDetailResponse>('/servers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    createdId = res.server.id;
  } catch (err) {
    return toError(err, 'Failed to create server');
  }

  revalidatePath('/dashboard');
  redirect(`/servers/${createdId}`);
}

export async function runServerActionById(
  id: string,
  action: ServerAction,
): Promise<ActionError | void> {
  try {
    await apiFetch(`/servers/${id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  } catch (err) {
    return toError(err, 'Action failed');
  }
  revalidatePath(`/servers/${id}`);
  revalidatePath('/dashboard');
}

export async function deleteServerAction(id: string): Promise<ActionError | void> {
  try {
    await apiFetch(`/servers/${id}`, { method: 'DELETE' });
  } catch (err) {
    return toError(err, 'Failed to delete server');
  }
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
