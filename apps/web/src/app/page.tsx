import Link from 'next/link';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // If Supabase isn't configured yet, show the marketing landing instead of crashing.
  if (env.supabaseUrl && env.supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect('/dashboard');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-400">
          {env.siteName}
        </p>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Host CRMP &amp; SA-MP servers in seconds
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Spin up isolated game servers, control them from one dashboard, and watch the live
          console — all on the Alexion platform.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="btn-primary">
          Sign in
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
