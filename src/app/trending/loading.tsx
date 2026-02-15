import { Skeleton } from '@/components/ui/Skeleton';

export default function TrendingLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-7 w-48" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="text-right">
              <Skeleton className="mb-1 h-6 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
