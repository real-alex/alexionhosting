import Link from 'next/link';
import type { UserProfile } from '@alexion/shared';
import { env } from '@/lib/env';
import { SignOutButton } from './sign-out-button';

export function TopNav({ profile }: { profile: UserProfile | null }) {
  return (
    <header className="border-b border-ink-600/60 bg-ink-800/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 font-bold text-white">
              A
            </span>
            <span className="text-lg font-bold text-white">{env.siteName}</span>
          </Link>
          <nav className="hidden gap-4 text-sm text-slate-300 sm:flex">
            <Link href="/dashboard" className="hover:text-white">
              Servers
            </Link>
            <Link href="/servers/new" className="hover:text-white">
              New server
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{profile.email}</p>
              <p className="text-xs capitalize text-slate-400">{profile.role}</p>
            </div>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
