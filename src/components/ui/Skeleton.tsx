export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-zinc-800 ${className}`} />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 ${className}`}>
      <Skeleton className="mb-4 h-4 w-1/3" />
      <Skeleton className="mb-3 h-8 w-1/2" />
      <SkeletonText lines={2} />
    </div>
  );
}
