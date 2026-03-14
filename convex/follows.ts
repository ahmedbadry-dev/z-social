import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUserId, requireAuthUserId } from "./helpers"

export const toggleFollow = mutation({
  args: { targetUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    if (currentUserId === args.targetUserId) {
      throw new ConvexError("You cannot follow yourself")
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) => q.eq("followerId", currentUserId).eq("followingId", args.targetUserId))
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
    } else {
      await ctx.db.insert("follows", {
        followerId: currentUserId,
        followingId: args.targetUserId,
        createdAt: Date.now(),
      })

      await ctx.db.insert("notifications", {
        userId: args.targetUserId,
        actorId: currentUserId,
        type: "follow",
        read: false,
        createdAt: Date.now(),
      })
    }

    const followersCount = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.targetUserId))
      .collect()
      .then((rows) => rows.length)

    return { following: !existing, followersCount }
  },
})

export const getFollowStatus = query({
  args: { targetUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const isFollowing = currentUserId
      ? !!(await ctx.db
          .query("follows")
          .withIndex("by_pair", (q) => q.eq("followerId", currentUserId).eq("followingId", args.targetUserId))
          .unique())
      : false

    const followersCount = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.targetUserId))
      .collect()
      .then((rows) => rows.length)

    const followingCount = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.targetUserId))
      .collect()
      .then((rows) => rows.length)

    return { isFollowing, followersCount, followingCount }
  },
})

export const getFollowingIds = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) {
      return []
    }

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
      .collect()
    return follows.map((follow) => follow.followingId)
  },
})
