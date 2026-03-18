import { PostSkeleton } from "@/components/shared/post-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
      <PostSkeleton />
      <PostSkeleton />
    </div>
  )
}
