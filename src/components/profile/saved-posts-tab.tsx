"use client"

import { Bookmark } from "lucide-react"
import { usePaginatedQuery, useQuery } from "convex/react"
import { PostCard } from "@/components/feed/post-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useInfiniteScroll } from "@/components/shared/use-infinite-scroll"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { api } from "../../../convex/_generated/api"

export function SavedPostsTab() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getSavedPosts,
    {},
    { initialNumItems: 10 }
  )
  const loaderRef = useInfiniteScroll(
    () => loadMore(10),
    status === "CanLoadMore"
  )

  if (status === "LoadingFirstPage" || currentUser === undefined) {
    return (
      <div className="space-y-4 ">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }

  if (status === "Exhausted" && results.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No saved posts"
        description="Save posts to view them here"
      />
    )
  }

  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")

  return (
    <div className="space-y-4 ">
      {results.map((post) => (
        <PostCard
          key={post._id}
          currentUserId={currentUserId}
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
            myReaction: post.myReaction,
            reactionsCount: post.reactionsCount,
            reactionsSummary: post.reactionsSummary,
            commentsCount: post.commentsCount,
            isSavedByMe: post.isSavedByMe,
            isOwnPost: currentUserId === post.authorId,
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
