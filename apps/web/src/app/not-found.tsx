import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-white">404</h1>
      <p className="text-slate-400">We couldn&apos;t find that page or server.</p>
      <Link href="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </main>
  );
}
