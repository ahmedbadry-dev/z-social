# V1.9 — Feed Algorithm: Discovery Mode + Social Context + Banner
# Branch: v1.9/phase-1-feed-algorithm

---

## READ FIRST (FULLY before touching anything)
- `convex/posts.ts` — getFeedPosts, buildPostWithMeta
- `convex/schema.ts` — tables structure
- `src/components/feed/feed-list.tsx`
- `src/components/feed/feed-content.tsx`
- `src/components/feed/post-card.tsx`

---

## OVERVIEW

3 changes to implement in order:

1. **Discovery Mode** — new users with 0 follows see all posts instead of empty feed
2. **Social Context Label** — "Ahmed liked this" / "Ahmed commented on this" above posts from non-followed users
3. **Discovery Banner** — shown only when in discovery mode, disappears once user follows someone

---

## CHANGE 1 — convex/posts.ts: Update getFeedPosts for Discovery Mode

### Current behavior:
```typescript
const filteredPage = result.page.filter((post) =>
  authorIds.size === 0 ? false : authorIds.has(post.authorId)
)
```
When user has 0 follows → returns empty array → empty feed.

### New behavior:
```typescript
// Discovery mode: user has no follows yet
const isDiscoveryMode = authorIds.size === 0

const filteredPage = result.page.filter((post) => {
  if (isDiscoveryMode) return true  // show all posts
  return authorIds.has(post.authorId)
})
```

Also update the return to include `isDiscoveryMode`:
```typescript
return { ...result, page, isDiscoveryMode }
```

**Important:** `isDiscoveryMode` must be added to the return type.
Convex will infer the type automatically.

---

## CHANGE 2 — convex/posts.ts: Add Social Context to feed posts

### What it does:
For each post in the feed that is NOT from a followed user (i.e. from a stranger),
find if any of the current user's follows liked or commented on that post.
If yes, attach the context: who did the action and what action.

### Add a new helper function `getSocialContext`:
```typescript
async function getSocialContext(
  ctx: QueryCtx,
  postId: Id<"posts">,
  followingIds: string[],
  currentUserId: string
): Promise<{ actorName: string; actorId: string; action: "liked" | "commented" } | null> {
  if (followingIds.length === 0) return null

  // Check if any followed user liked this post
  const likes = await ctx.db
    .query("likes")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect()

  const likedByFollowing = likes.find(
    (like) => followingIds.includes(like.userId) && like.userId !== currentUserId
  )

  if (likedByFollowing) {
    const actor = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", likedByFollowing.userId))
      .first()
    return {
      actorId: likedByFollowing.userId,
      actorName: actor?.name ?? likedByFollowing.userId,
      action: "liked",
    }
  }

  // Check if any followed user commented on this post
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect()

  const commentedByFollowing = comments.find(
    (comment) => followingIds.includes(comment.authorId) && comment.authorId !== currentUserId
  )

  if (commentedByFollowing) {
    const actor = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", commentedByFollowing.authorId))
      .first()
    return {
      actorId: commentedByFollowing.authorId,
      actorName: actor?.name ?? commentedByFollowing.authorId,
      action: "commented",
    }
  }

  return null
}
```

### Update buildPostWithMeta to accept socialContext:
```typescript
async function buildPostWithMeta(
  ctx: QueryCtx | MutationCtx,
  post: PostDoc,
  currentUserId: string | null,
  socialContext?: { actorName: string; actorId: string; action: "liked" | "commented" } | null
) {
  // ... existing code unchanged ...

  return {
    ...post,
    myReaction,
    reactionsCount,
    reactionsSummary,
    commentsCount,
    isSavedByMe,
    socialContext: socialContext ?? null,
  }
}
```

### Update getFeedPosts to pass social context:

```typescript
export const getFeedPosts = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const result = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .paginate(args.paginationOpts)

    let authorIds = new Set<string>()
    let followingIds: string[] = []

    if (currentUserId) {
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
        .collect()
      followingIds = follows.map((f) => f.followingId)
      authorIds = new Set([currentUserId, ...followingIds])
    }

    const isDiscoveryMode = authorIds.size === 0

    const filteredPage = result.page.filter((post) => {
      if (isDiscoveryMode) return true
      return authorIds.has(post.authorId)
    })

    const page = await Promise.all(
      filteredPage.map(async (post) => {
        // Only compute social context for posts from non-followed users
        // (not own posts, not posts from people we follow)
        const isFromStranger = currentUserId
          && post.authorId !== currentUserId
          && !followingIds.includes(post.authorId)

        const socialContext = isFromStranger && currentUserId
          ? await getSocialContext(ctx, post._id, followingIds, currentUserId)
          : null

        return buildPostWithMeta(ctx, post, currentUserId, socialContext)
      })
    )

    return { ...result, page, isDiscoveryMode }
  },
})
```

---

## CHANGE 3 — src/components/feed/post-card.tsx: Add social context label

### Update PostCardProps interface:
```typescript
interface PostCardProps {
  post: {
    // ... existing fields unchanged ...
    socialContext?: {
      actorName: string
      actorId: string
      action: "liked" | "commented"
    } | null
  }
  currentUserId: string
  defaultShowComments?: boolean
}
```

### Add social context label above the card:
At the very top of the PostCard return, BEFORE the main card div, add:

```tsx
{post.socialContext && (
  <div className="flex items-center gap-1.5 px-1 pb-1 -mb-2">
    <div className="h-px w-3 bg-border" />
    <Link
      href={`/profile?userId=${post.socialContext.actorId}`}
      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="font-medium text-foreground/70">
        {post.socialContext.actorName}
      </span>
      <span>
        {post.socialContext.action === "liked" ? "liked this" : "commented on this"}
      </span>
    </Link>
  </div>
)}
```

---

## CHANGE 4 — src/components/feed/feed-list.tsx: Discovery Banner + pass socialContext

### Add Discovery Banner component inside feed-list.tsx:
```tsx
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
```

Import `Compass` from `"lucide-react"`.

### Update FeedList to show banner and pass socialContext:

The `usePaginatedQuery` for `getFeedPosts` now returns `isDiscoveryMode` in the first page.
Access it via `results[0]` or check if follows count is 0.

Since `usePaginatedQuery` returns a flat `results` array (not the raw pages with metadata),
we need a separate way to know if we're in discovery mode.

**Simple approach:** Add a separate query:
```typescript
const followingIds = useQuery(api.follows.getFollowingIds)
const isDiscoveryMode = followingIds !== undefined && followingIds.length === 0
```

Then in the render, show the banner when `isDiscoveryMode`:
```tsx
return (
  <div className="space-y-4">
    {isDiscoveryMode && <DiscoveryBanner />}
    {resolvedResults.map((post, index) => (
      <AnimatedPost key={post._id} index={index}>
        <PostCard
          currentUserId={currentUserId}
          post={{
            // ... existing fields ...
            socialContext: post.socialContext,
          }}
        />
      </AnimatedPost>
    ))}
    {/* ... rest unchanged ... */}
  </div>
)
```

### Pass socialContext in PostCard props:
In the `resolvedResults.map(...)`, add `socialContext: post.socialContext` to the post object.

---

## CHANGE 5 — src/components/feed/feed-list.tsx: Fix empty state for discovery mode

When discovery mode is on and there are NO posts at all (brand new platform):
```tsx
// BEFORE:
if ((status === "Exhausted" || preloaded) && resolvedResults.length === 0) {
  return (
    <EmptyState
      icon={Newspaper}
      title="Your feed is empty"
      description="Follow people to see their posts here"
    />
  )
}

// AFTER:
if ((status === "Exhausted" || preloaded) && resolvedResults.length === 0) {
  return (
    <div className="space-y-4">
      <DiscoveryBanner />
      <EmptyState
        icon={Newspaper}
        title="No posts yet"
        description="Be the first to share something with the community"
      />
    </div>
  )
}
```

---

## FILES TO CHANGE
- `convex/posts.ts`
- `src/components/feed/post-card.tsx`
- `src/components/feed/feed-list.tsx`

## DO NOT TOUCH
- `src/components/ui/*`
- `src/proxy.ts`
- `src/lib/auth-server.ts`
- Any other file

## AFTER CHANGES
1. Run `npm run build`
2. Fix any TypeScript errors
3. Pay attention to: the `socialContext` type must match exactly between convex return and component props

## COMPLETION FORMAT
```
✅ Feed algorithm: discovery mode + social context + banner
Files changed:
- convex/posts.ts
- src/components/feed/post-card.tsx
- src/components/feed/feed-list.tsx
Build: passed
```
