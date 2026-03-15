"use client"

import { FileText } from "lucide-react"
import { usePaginatedQuery } from "convex/react"
import { PostCard } from "@/components/feed/post-card"
import { EmptyState } from "@/components/shared/empty-state"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { Button } from "@/components/ui/button"
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

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-4 p-6">
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
    <div className="space-y-4 p-6">
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
            authorName: post.authorName ?? post.authorId,
            authorImage: post.authorImage,
            createdAt: post.createdAt,
            isEdited: post.isEdited,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            isLikedByMe: post.isLikedByMe,
            isSavedByMe: post.isSavedByMe,
            isOwnPost: true,
          }}
        />
      ))}
      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={() => loadMore(10)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
