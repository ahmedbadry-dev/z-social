"use client"

import { motion, useInView } from "motion/react"
import { Newspaper } from "lucide-react"
import { useRef } from "react"
import { type Preloaded, usePaginatedQuery, usePreloadedQuery } from "convex/react"
import { PostCard } from "@/components/feed/post-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useInfiniteScroll } from "@/components/shared/use-infinite-scroll"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { api } from "../../../convex/_generated/api"
import { useAuthStore } from "@/stores/auth-store"

interface FeedListProps {
  preloadedPosts?: Preloaded<typeof api.posts.getFeedPosts>
}

function AnimatedPost({
  children,
  index: _index,
}: {
  children: React.ReactNode
  index: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

export function FeedList({ preloadedPosts }: FeedListProps) {
  const { cachedUser } = useAuthStore()
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

  const currentUserId = cachedUser?.userId ?? ""

  return (
    <div className="space-y-4">
      {resolvedResults.map((post, index) => (
        <AnimatedPost
          key={post._id}
          index={index}
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
        </AnimatedPost>
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
