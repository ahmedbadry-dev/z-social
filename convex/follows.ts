import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUserId, requireAuthUserId } from "./helpers"

export const followUser = mutation({
  args: { targetUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    if (currentUserId === args.targetUserId) {
      throw new ConvexError("You cannot follow yourself")
    }

    const allExistingRequests = await ctx.db
      .query("followRequests")
      .withIndex("by_pair", (q) =>
        q.eq("fromUserId", currentUserId).eq("toUserId", args.targetUserId)
      )
      .collect()

    if (allExistingRequests.length > 1) {
      const sorted = allExistingRequests.sort((a, b) => b.createdAt - a.createdAt)
      await Promise.all(sorted.slice(1).map((request) => ctx.db.delete(request._id)))
    }

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", currentUserId).eq("followingId", args.targetUserId)
      )
      .first()

    if (existingFollow) {
      await ctx.db.delete(existingFollow._id)
      return { action: "unfollowed" }
    }

    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first()

    const isPrivate = targetProfile?.isPrivate ?? false

    if (isPrivate) {
      const existingRequest = await ctx.db
        .query("followRequests")
        .withIndex("by_pair", (q) =>
          q.eq("fromUserId", currentUserId).eq("toUserId", args.targetUserId)
        )
        .first()

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          await ctx.db.delete(existingRequest._id)
          return { action: "request_cancelled" }
        }
        if (existingRequest.status === "rejected") {
          await ctx.db.delete(existingRequest._id)
        }
        if (existingRequest.status === "accepted") {
          await ctx.db.delete(existingRequest._id)
        }
      }

      await ctx.db.insert("followRequests", {
        fromUserId: currentUserId,
        toUserId: args.targetUserId,
        status: "pending",
        createdAt: Date.now(),
      })

      await ctx.db.insert("notifications", {
        userId: args.targetUserId,
        actorId: currentUserId,
        type: "follow_request",
        read: false,
        createdAt: Date.now(),
      })

      return { action: "request_sent" }
    }

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

    return { action: "followed" }
  },
})

export const acceptFollowRequest = mutation({
  args: { fromUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)

    const request = await ctx.db
      .query("followRequests")
      .withIndex("by_pair", (q) =>
        q.eq("fromUserId", args.fromUserId).eq("toUserId", currentUserId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first()

    if (!request) {
      throw new ConvexError("Follow request not found")
    }

    await ctx.db.delete(request._id)

    await ctx.db.insert("follows", {
      followerId: args.fromUserId,
      followingId: currentUserId,
      createdAt: Date.now(),
    })

    await ctx.db.insert("notifications", {
      userId: args.fromUserId,
      actorId: currentUserId,
      type: "follow_accept",
      read: false,
      createdAt: Date.now(),
    })

    return { accepted: true }
  },
})

export const rejectFollowRequest = mutation({
  args: { fromUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)

    const request = await ctx.db
      .query("followRequests")
      .withIndex("by_pair", (q) =>
        q.eq("fromUserId", args.fromUserId).eq("toUserId", currentUserId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first()

    if (!request) {
      throw new ConvexError("Follow request not found")
    }

    await ctx.db.patch(request._id, { status: "rejected" })

    return { rejected: true }
  },
})

export const getFollowStatus = query({
  args: { targetUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const isFollowing = currentUserId
      ? !!(await ctx.db
          .query("follows")
          .withIndex("by_pair", (q) =>
            q.eq("followerId", currentUserId).eq("followingId", args.targetUserId)
          )
          .first())
      : false

    const pendingRequest = currentUserId
      ? await ctx.db
          .query("followRequests")
          .withIndex("by_pair", (q) =>
            q.eq("fromUserId", currentUserId).eq("toUserId", args.targetUserId)
          )
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first()
      : null

    const hasRequestedFollow = !!pendingRequest

    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first()

    const isPrivate = targetProfile?.isPrivate ?? false

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

    return {
      isFollowing,
      hasRequestedFollow,
      isPrivate,
      followersCount,
      followingCount,
    }
  },
})

export const getPendingFollowRequests = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return []

    const requests = await ctx.db
      .query("followRequests")
      .withIndex("by_to", (q) => q.eq("toUserId", currentUserId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect()

    return Promise.all(
      requests.map(async (req) => {
        const userDoc = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", req.fromUserId))
          .first()

        return {
          _id: req._id,
          fromUserId: req.fromUserId,
          fromName: userDoc?.name ?? null,
          fromImage: userDoc?.image ?? null,
          createdAt: req.createdAt,
        }
      })
    )
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
        const userDoc = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", doc.followerId))
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
          name: userDoc?.name ?? null,
          image: userDoc?.image ?? null,
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
        const userDoc = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", doc.followingId))
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
          name: userDoc?.name ?? null,
          image: userDoc?.image ?? null,
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

export const cleanupDuplicateRequests = mutation({
  args: {},
  handler: async (ctx) => {
    const allRequests = await ctx.db.query("followRequests").collect()

    const seen = new Map<string, string>()
    const toDelete: string[] = []

    for (const req of allRequests) {
      const key = `${req.fromUserId}_${req.toUserId}`
      if (seen.has(key)) {
        toDelete.push(req._id)
      } else {
        seen.set(key, req._id)
      }
    }

    await Promise.all(toDelete.map((id) => ctx.db.delete(id as any)))
    return { deleted: toDelete.length }
  },
})
