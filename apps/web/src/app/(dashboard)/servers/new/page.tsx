import Link from 'next/link';
import { CreateServerForm } from '@/components/create-server-form';

export const dynamic = 'force-dynamic';

export default function NewServerPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Back to servers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Create a new server</h1>
        <p className="text-sm text-slate-400">
          We&apos;ll provision an isolated container and assign a public port automatically.
        </p>
      </div>
      <CreateServerForm />
    </div>
  );
}
