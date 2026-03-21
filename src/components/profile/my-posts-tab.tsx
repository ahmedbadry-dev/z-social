"use client"

import { FileText } from "lucide-react"
import { usePaginatedQuery } from "convex/react"
import { PostCard } from "@/components/feed/post-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useInfiniteScroll } from "@/components/shared/use-infinite-scroll"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { api } from "../../../convex/_generated/api"

interface MyPostsTabProps {
  userId: string
}

export function MyPostsTab({ userId }: MyPostsTabProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getPostsByUser,
    { userId },
    { initialNumItems: 10 }
  )
  const loaderRef = useInfiniteScroll(
    () => loadMore(10),
    status === "CanLoadMore"
  )

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }

  if (status === "Exhausted" && results.length === 0) {
    return (
      <EmptyState icon={FileText} title="No posts yet" description="Share your first post!" />
    )
  }

  return (
    <div className="space-y-4 ">
      {results.map((post) => (
        <PostCard
          key={post._id}
          currentUserId={userId}
          post={{
            _id: post._id,
            content: post.content,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            authorId: post.authorId,
            authorName: post.authorName ?? "Unknown",
            authorImage: post.authorImage,
            createdAt: post.createdAt,
            isEdited: post.isEdited,
            myReaction: post.myReaction,
            reactionsCount: post.reactionsCount,
            reactionsSummary: post.reactionsSummary,
            commentsCount: post.commentsCount,
            isSavedByMe: post.isSavedByMe,
            isOwnPost: true,
          }}
        />
      ))}
      {status === "CanLoadMore" && (
        <div ref={loaderRef} className="py-2">
          <PostSkeleton />
        </div>
      )}

      {status === "LoadingMore" && (
        <div className="space-y-4">
          <PostSkeleton />
        </div>
      )}
    </div>
  )
}
