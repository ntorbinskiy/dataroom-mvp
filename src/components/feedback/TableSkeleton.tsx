import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card p-2">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-3.5">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}
