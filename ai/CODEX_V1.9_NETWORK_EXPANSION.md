# V1.9 Phase 3 — Network Expansion (Friends of Friends + Strangers Tier)
# Branch: v1.9/phase-3-network-expansion

---

## READ FIRST (FULLY before touching anything)
- `convex/posts.ts` — read getDiscoveryPosts fully (added in Phase 2)
- `src/components/feed/feed-list.tsx` — read fully (INJECT_EVERY = 3 currently)

---

## OVERVIEW

Two changes:

1. **INJECT_EVERY: 3 → 2** — inject discovery posts more frequently
2. **Tiered discovery** — priority order in getDiscoveryPosts:
   - Tier 1: posts from friends-of-friends (people your follows follow)
   - Tier 2: posts from complete strangers (current behavior)

---

## CHANGE 1 — src/components/feed/feed-list.tsx

Change the injection rate constant:

```typescript
// BEFORE:
const INJECT_EVERY = 3

// AFTER:
const INJECT_EVERY = 2
```

Only this one line. Nothing else in this file.

---

## CHANGE 2 — convex/posts.ts: Update getDiscoveryPosts with tier system

Read the current `getDiscoveryPosts` implementation fully first.

Replace the handler with a tiered version:

```typescript
export const getDiscoveryPosts = query({
  args: {
    limit: v.optional(v.number()),
    excludePostIds: v.optional(v.array(v.id("posts"))),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    const limit = args.limit ?? 8
    const excludeIds = new Set(args.excludePostIds ?? [])

    // Get who the current user follows
    let followingIds: string[] = []
    if (currentUserId) {
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
        .collect()
      followingIds = follows.map((f) => f.followingId)
    }

    const followingSet = new Set([...(currentUserId ? [currentUserId] : []), ...followingIds])

    // ── TIER 1: Friends of Friends ──────────────────────────────────────
    // Get who our follows follow (second-degree connections)
    const friendsOfFriendsIds = new Set<string>()
    for (const followedId of followingIds) {
      const theirFollows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", followedId))
        .collect()
      for (const f of theirFollows) {
        // Only add if not already in our network
        if (!followingSet.has(f.followingId)) {
          friendsOfFriendsIds.add(f.followingId)
        }
      }
    }

    // Get recent posts from friends-of-friends
    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(150)

    const tier1Posts = recentPosts.filter((post) => {
      if (excludeIds.has(post._id)) return false
      return friendsOfFriendsIds.has(post.authorId)
    })

    const tier2Posts = recentPosts.filter((post) => {
      if (excludeIds.has(post._id)) return false
      if (followingSet.has(post.authorId)) return false
      if (friendsOfFriendsIds.has(post.authorId)) return false
      return true
    })

    // ── Score and merge tiers ───────────────────────────────────────────
    // Build meta for top candidates from each tier
    const tier1Candidates = tier1Posts.slice(0, 20)
    const tier2Candidates = tier2Posts.slice(0, 20)

    const [tier1WithMeta, tier2WithMeta] = await Promise.all([
      Promise.all(tier1Candidates.map((post) => buildPostWithMeta(ctx, post, currentUserId))),
      Promise.all(tier2Candidates.map((post) => buildPostWithMeta(ctx, post, currentUserId))),
    ])

    const score = (post: { reactionsCount: number; commentsCount: number }) =>
      post.reactionsCount + post.commentsCount * 2

    const tier1Scored = tier1WithMeta
      .map((post) => ({ ...post, isDiscoveryPost: true as const, discoveryTier: 1 as const }))
      .sort((a, b) => score(b) - score(a))

    const tier2Scored = tier2WithMeta
      .map((post) => ({ ...post, isDiscoveryPost: true as const, discoveryTier: 2 as const }))
      .sort((a, b) => score(b) - score(a))

    // Fill quota: prefer Tier 1, fill remainder with Tier 2
    const tier1Count = Math.min(tier1Scored.length, Math.ceil(limit * 0.6))
    const tier2Count = limit - tier1Count

    const result = [
      ...tier1Scored.slice(0, tier1Count),
      ...tier2Scored.slice(0, tier2Count),
    ]

    return result
  },
})
```

---

## IMPORTANT NOTES

- `buildPostWithMeta` already exists in `convex/posts.ts` — don't redefine it
- The loop over `followingIds` to get friends-of-friends is O(follows × their_follows)
  This is acceptable for typical social graphs (< 500 follows)
- `discoveryTier` field is added to each post for potential future UI differentiation
  (e.g. "Friend of Ahmed follows this person")
- The 60/40 tier split: `Math.ceil(limit * 0.6)` for Tier 1, remainder for Tier 2
- If user has 0 follows → `followingIds` is empty → `friendsOfFriendsIds` is empty
  → all posts go to Tier 2 (current behavior) — this is correct

---

## FILES TO CHANGE
- `src/components/feed/feed-list.tsx` — INJECT_EVERY: 3 → 2
- `convex/posts.ts` — update getDiscoveryPosts with tier system

## DO NOT TOUCH
- `src/components/ui/*`
- `src/proxy.ts`
- `src/lib/auth-server.ts`
- Any other existing query or mutation in convex/posts.ts

## AFTER CHANGES
1. Run `npm run build`
2. Fix any TypeScript errors

## COMPLETION FORMAT
```
✅ Phase 3: Network expansion with friends-of-friends tier
Files changed:
- convex/posts.ts
- src/components/feed/feed-list.tsx
Build: passed
```
