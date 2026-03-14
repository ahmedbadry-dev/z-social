import { query } from "./_generated/server"
import { getCurrentUserId } from "./helpers"

export const getSuggestedUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return []

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
      .collect()

    const followingIds = new Set(following.map((item) => item.followingId))
    followingIds.add(currentUserId)

    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(20)

    const seen = new Set<string>()
    const suggestedIds: string[] = []

    for (const post of recentPosts) {
      if (!followingIds.has(post.authorId) && !seen.has(post.authorId)) {
        seen.add(post.authorId)
        suggestedIds.push(post.authorId)
      }
      if (suggestedIds.length >= 4) break
    }

    return suggestedIds.map((userId) => ({ userId }))
  },
})
