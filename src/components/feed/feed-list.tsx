"use client"

import { Newspaper } from "lucide-react"
import { type Preloaded, usePaginatedQuery, usePreloadedQuery, useQuery } from "convex/react"
import { PostCard } from "@/components/feed/post-card"
import { EmptyState } from "@/components/shared/empty-state"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { Button } from "@/components/ui/button"
import { api } from "../../../convex/_generated/api"

interface FeedListProps {
  preloadedPosts?: Preloaded<typeof api.posts.getFeedPosts>
}

export function FeedList({ preloadedPosts }: FeedListProps) {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const preloaded = preloadedPosts
    ? usePreloadedQuery(preloadedPosts)
    : null
  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getFeedPosts,
    {},
    { initialNumItems: 10 }
  )

  if (status === "LoadingFirstPage" && !preloaded) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }

  const resolvedResults = preloaded?.page ?? results

  if ((status === "Exhausted" || preloaded) && resolvedResults.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="Your feed is empty"
        description="Follow people to see their posts here"
      />
    )
  }

  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")

  return (
    <div className="space-y-4">
      {resolvedResults.map((post) => (
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
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={() => loadMore(10)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
