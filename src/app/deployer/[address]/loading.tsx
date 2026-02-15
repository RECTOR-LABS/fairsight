import { Skeleton } from '@/components/ui/Skeleton';

export default function DeployerLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-16" />

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Token table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
