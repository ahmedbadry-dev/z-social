# V1.9 Phase 2 — Discovery Post Injection (65/35 split)
# Branch: v1.9/phase-2-discovery-injection

---

## READ FIRST (FULLY before touching anything)
- `convex/posts.ts` — read the CURRENT getFeedPosts fully
- `src/components/feed/feed-list.tsx` — read fully
- `convex/follows.ts` — getFollowingIds query

---

## CONCEPT

When the user scrolls the feed, we want to inject discovery posts
(from people they don't follow) between their regular feed posts.

**Ratio:** every 3 posts from follows → 1 discovery post injected
(approximately 65% follows / 35% discovery)

**Why client-side injection and not server-side:**
The main `getFeedPosts` query uses Convex pagination cursors.
Mixing two different queries into one paginated result would break the cursor.
The correct production approach is:
- `getFeedPosts` — handles followed users posts (paginated, cursor-based)
- `getDiscoveryPosts` — a separate non-paginated query that returns a pool
  of discovery posts, refreshed as the user scrolls

The frontend merges them visually.

---

## CHANGE 1 — convex/posts.ts: Add getDiscoveryPosts query

Add this new query at the end of the file:

```typescript
export const getDiscoveryPosts = query({
  args: {
    // How many discovery posts to fetch in the pool
    limit: v.optional(v.number()),
    // Posts to exclude (already shown in feed)
    excludePostIds: v.optional(v.array(v.id("posts"))),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    const limit = args.limit ?? 5
    const excludeIds = new Set(args.excludePostIds ?? [])

    // Get the IDs of people the user follows (to exclude their posts)
    let followingIds = new Set<string>()
    if (currentUserId) {
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
        .collect()
      followingIds = new Set([currentUserId, ...follows.map((f) => f.followingId)])
    }

    // Get recent posts from people NOT followed
    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(100)

    const discoveryPool = recentPosts.filter((post) => {
      if (excludeIds.has(post._id)) return false
      if (followingIds.has(post.authorId)) return false
      return true
    })

    // Sort by engagement (reactions + comments * 2) for quality
    const withMeta = await Promise.all(
      discoveryPool.slice(0, 30).map((post) => buildPostWithMeta(ctx, post, currentUserId))
    )

    const scored = withMeta
      .map((post) => ({
        ...post,
        _score: post.reactionsCount + post.commentsCount * 2,
        isDiscoveryPost: true as const,
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)

    return scored
  },
})
```

---

## CHANGE 2 — src/components/feed/feed-list.tsx: Inject discovery posts

### Logic:
- Fetch a pool of discovery posts via `useQuery(api.posts.getDiscoveryPosts)`
- Every 3 regular feed posts, inject 1 discovery post
- Track which discovery posts have been shown to avoid repeats
- When the user loads more feed posts, refresh the discovery pool

### Full implementation:

```tsx
"use client"

import { motion, useInView } from "motion/react"
import { Compass, Newspaper } from "lucide-react"
import { useRef, useMemo } from "react"
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

// Label shown above injected discovery posts
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

// Discovery Banner for users with 0 follows
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

// Inject discovery posts every N regular posts
const INJECT_EVERY = 3

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

  // Get the IDs of regular feed posts to exclude from discovery
  const feedPostIds = useMemo(
    () => results.map((p) => p._id as Id<"posts">"),
    [results]
  )

  // Check if user has any follows (for discovery mode detection)
  const followingIds = useQuery(api.follows.getFollowingIds)
  const isDiscoveryMode = followingIds !== undefined && followingIds.length === 0

  // Fetch discovery posts pool (excluded already-shown feed posts)
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

  // Build the merged feed: inject 1 discovery post every INJECT_EVERY regular posts
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
      // After every INJECT_EVERY posts, inject a discovery post
      if (
        (index + 1) % INJECT_EVERY === 0 &&
        discoveryIndex < discoveryPosts.length
      ) {
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
        <AnimatedPost key={post._id} index={index}>
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
```

---

## IMPORTANT NOTES

- `getDiscoveryPosts` is skipped (`"skip"`) when user is in discovery mode
  (0 follows) because in discovery mode ALL posts already show in the main feed
- The `feedPostIds.slice(0, 30)` limit prevents sending too many IDs to Convex
- `socialContext` is passed with a safe fallback for discovery posts that
  don't have it: `"socialContext" in post ? post.socialContext : null`
- The `_score` field is internal to the query and not exposed to the UI

---

## FILES TO CHANGE
- `convex/posts.ts` — add `getDiscoveryPosts` query
- `src/components/feed/feed-list.tsx` — full rewrite with injection logic

## DO NOT TOUCH
- `src/components/ui/*`
- `src/proxy.ts`
- `src/lib/auth-server.ts`
- `convex/posts.ts` existing queries — only ADD, don't modify

## AFTER CHANGES
1. Run `npm run build`
2. Fix TypeScript errors — pay attention to the union type in `mergedFeed`
3. The `feedPostIds` array type must be `Id<"posts">[]`

## COMPLETION FORMAT
```
✅ Phase 2: Discovery post injection (65/35 split)
Files changed:
- convex/posts.ts
- src/components/feed/feed-list.tsx
Build: passed
```
