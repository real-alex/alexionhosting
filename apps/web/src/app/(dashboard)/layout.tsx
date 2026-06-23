import { redirect } from 'next/navigation';
import type { UserProfile } from '@alexion/shared';
import { TopNav } from '@/components/top-nav';
import { apiFetch } from '@/lib/api';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="card">
          <h1 className="text-xl font-bold text-white">Finish your setup</h1>
          <p className="mt-2 text-slate-400">
            Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to{' '}
            <code>.env</code> and fill in your Supabase project URL and keys, then restart the web
            app.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Best-effort profile load; the dashboard still renders if the API is down.
  let profile: UserProfile | null = null;
  try {
    profile = await apiFetch<UserProfile>('/auth/me');
  } catch {
    profile = { id: user.id, email: user.email ?? '', displayName: null, role: 'customer', createdAt: '' };
  }

  return (
    <div className="min-h-screen">
      <TopNav profile={profile} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
