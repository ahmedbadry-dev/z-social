import { v } from "convex/values"
import { query } from "./_generated/server"
import { getCurrentUserId } from "./helpers"

export const getLikesCount = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    return likes.length
  },
})

export const isPostLikedByMe = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) {
      return false
    }

    const like = await ctx.db
      .query("likes")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", currentUserId))
      .unique()
    return !!like
  },
})
