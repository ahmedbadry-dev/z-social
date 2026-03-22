"use client"

import { motion } from "motion/react"
import { Newspaper } from "lucide-react"
import { type Preloaded, usePaginatedQuery, usePreloadedQuery, useQuery } from "convex/react"
import { PostCard } from "@/components/feed/post-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useInfiniteScroll } from "@/components/shared/use-infinite-scroll"
import { PostSkeleton } from "@/components/shared/post-skeleton"
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
  const loaderRef = useInfiniteScroll(
    () => loadMore(10),
    status === "CanLoadMore"
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
      {resolvedResults.map((post, index) => (
        <motion.div
          key={post._id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: Math.min(index * 0.05, 0.3),
            ease: "easeOut",
          }}
        >
          <PostCard
            currentUserId={currentUserId}
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
              isOwnPost: currentUserId === post.authorId,
            }}
          />
        </motion.div>
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
