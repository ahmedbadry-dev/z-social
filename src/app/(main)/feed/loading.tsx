import { PostSkeleton } from "@/components/shared/post-skeleton"

export default function FeedLoading() {
  return (
    <div className="space-y-4">
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </div>
  )
}
