import { PostSkeleton } from "@/components/shared/post-skeleton"

export default function PostDetailLoading() {
  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <PostSkeleton />
    </div>
  )
}
