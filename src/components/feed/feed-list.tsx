"use client"

import { motion, useInView } from "motion/react"
import { Compass, Newspaper, Users } from "lucide-react"
import { useMemo, useRef } from "react"
import { type Preloaded, usePaginatedQuery, usePreloadedQuery, useQuery } from "convex/react"
import { PostCard } from "@/components/feed/post-card"
import { EmptyState } from "@/components/shared/empty-state"
import { useInfiniteScroll } from "@/components/shared/use-infinite-scroll"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { api } from "../../../convex/_generated/api"
import { useAuthStore } from "@/stores/auth-store"
import type { Id } from "../../../convex/_generated/dataModel"

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

function DiscoveryLabel() {
  return (
    <div className="flex items-center gap-1.5 px-1 pb-1 -mb-2">
      <div className="h-px w-3 bg-border" />
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Compass className="size-3 text-[#3B55E6]" />
        <span>Suggested for you</span>
      </div>
    </div>
  )
}

function DiscoveryBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#3B55E6]/20 bg-[#3B55E6]/5 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3B55E6]/10">
        <Compass className="size-4 text-[#3B55E6]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Discover what's trending</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Follow people to personalize your feed with content you care about.
        </p>
      </div>
    </div>
  )
}

function EndOfFeedMessage({ isDiscoveryMode }: { isDiscoveryMode: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 px-6 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Users className="size-5 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium text-muted-foreground/70">
        {isDiscoveryMode
          ? "Follow people to see fresher content in your feed"
          : "Follow more people to see more posts"}
      </p>
      <p className="text-xs text-muted-foreground/50">You've seen all recent posts</p>
    </div>
  )
}

const INJECT_EVERY = 2

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
  const feedPostIds = useMemo<Id<"posts">[]>(
    () => results.map((post) => post._id as Id<"posts">),
    [results]
  )
  const followingIds = useQuery(api.follows.getFollowingIds)
  const isDiscoveryMode = followingIds !== undefined && followingIds.length === 0
  const discoveryPosts = useQuery(
    api.posts.getDiscoveryPosts,
    !isDiscoveryMode
      ? { limit: 8, excludePostIds: feedPostIds.slice(0, 30) }
      : "skip"
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
      <div className="space-y-4">
        {isDiscoveryMode && <DiscoveryBanner />}
        <EmptyState
          icon={Newspaper}
          title={isDiscoveryMode ? "No posts yet" : "Your feed is empty"}
          description={
            isDiscoveryMode
              ? "Be the first to share something with the community"
              : "Follow people to see their posts here"
          }
        />
      </div>
    )
  }

  const currentUserId = cachedUser?.userId ?? ""

  const mergedFeed = useMemo(() => {
    if (!discoveryPosts || discoveryPosts.length === 0 || isDiscoveryMode) {
      return resolvedResults.map((post) => ({ post, isDiscovery: false }))
    }

    const merged: Array<{
      post: (typeof resolvedResults)[number] | (typeof discoveryPosts)[number]
      isDiscovery: boolean
    }> = []

    let discoveryIndex = 0

    resolvedResults.forEach((post, index) => {
      merged.push({ post, isDiscovery: false })
      if ((index + 1) % INJECT_EVERY === 0 && discoveryIndex < discoveryPosts.length) {
        merged.push({ post: discoveryPosts[discoveryIndex], isDiscovery: true })
        discoveryIndex++
      }
    })

    return merged
  }, [resolvedResults, discoveryPosts, isDiscoveryMode])

  return (
    <div className="space-y-4">
      {isDiscoveryMode && <DiscoveryBanner />}
      {mergedFeed.map(({ post, isDiscovery }, index) => (
        <AnimatedPost
          key={post._id}
          index={index}
        >
          {isDiscovery && <DiscoveryLabel />}
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
              socialContext: "socialContext" in post ? post.socialContext : null,
            }}
          />
        </AnimatedPost>
      ))}

      {status === "Exhausted" && resolvedResults.length > 0 && (
        <EndOfFeedMessage isDiscoveryMode={isDiscoveryMode} />
      )}

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
