'use client';

import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TokenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-bold text-white">Report Failed</h2>
        <p className="text-sm text-zinc-400">
          {error.message || 'Unable to load token report. The token may not exist or data sources are unavailable.'}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Try another token
          </Link>
        </div>
      </div>
    </div>
  );
}
