import { Skeleton } from "@/components/ui/skeleton"

export function NotificationSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 p-4">
      <Skeleton className="h-2 w-2 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}
