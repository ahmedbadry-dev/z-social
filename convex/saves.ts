import { v } from "convex/values"
import { query } from "./_generated/server"
import { getCurrentUserId, requireAuthUserId } from "./helpers"

export const isPostSavedByMe = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) {
      return false
    }

    const save = await ctx.db
      .query("saves")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", currentUserId))
      .unique()
    return !!save
  },
})

export const getSavedPostIds = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await requireAuthUserId(ctx)
    const saves = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect()
    return saves.map((save) => save.postId)
  },
})
