import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';

export default function TokenLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Token header */}
      <div className="mb-8 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>

      {/* Score card */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="mb-4 h-3 w-48" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Reviews */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <Skeleton className="mb-4 h-5 w-40" />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}
