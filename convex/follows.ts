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

export const getFollowers = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const followerDocs = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect()

    return Promise.all(
      followerDocs.map(async (doc) => {
        const post = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", doc.followerId))
          .order("desc")
          .first()

        const isFollowedByMe = currentUserId
          ? !!(await ctx.db
              .query("follows")
              .withIndex("by_pair", (q) =>
                q.eq("followerId", currentUserId).eq("followingId", doc.followerId)
              )
              .unique())
          : false

        return {
          userId: doc.followerId,
          name: post?.authorName ?? null,
          image: post?.authorImage ?? null,
          isFollowedByMe,
        }
      })
    )
  },
})

export const getFollowing = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const followingDocs = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect()

    return Promise.all(
      followingDocs.map(async (doc) => {
        const post = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", doc.followingId))
          .order("desc")
          .first()

        const isFollowedByMe = currentUserId
          ? !!(await ctx.db
              .query("follows")
              .withIndex("by_pair", (q) =>
                q.eq("followerId", currentUserId).eq("followingId", doc.followingId)
              )
              .unique())
          : false

        return {
          userId: doc.followingId,
          name: post?.authorName ?? null,
          image: post?.authorImage ?? null,
          isFollowedByMe,
        }
      })
    )
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
