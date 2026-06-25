import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export function Skeleton({ className }: Props) {
  return (
    <div className={cn('animate-pulse rounded bg-slate-200', className)} />
  )
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center px-3 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}
