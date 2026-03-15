import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUserId, requireAuth, requireAuthUserId } from "./helpers"

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

export const getUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect()

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect()

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect()

    const profileDoc = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    const isFollowing = currentUserId
      ? !!(await ctx.db
          .query("follows")
          .withIndex("by_pair", (q) =>
            q.eq("followerId", currentUserId).eq("followingId", args.userId)
          )
          .unique())
      : false

    return {
      userId: args.userId,
      postsCount: posts.length,
      followersCount: followers.length,
      followingCount: following.length,
      isFollowing,
      isOwnProfile: currentUserId === args.userId,
      bio: profileDoc?.bio ?? "",
      username: profileDoc?.username ?? "",
      coverImageUrl: profileDoc?.coverImageUrl ?? null,
    }
  },
})

export const updateUserProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    username: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx)
    const currentUserId = currentUser.userId ?? String(currentUser._id)

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first()

    if (existing) {
      const updates: Record<string, string | undefined> = {}
      if (args.bio !== undefined) updates.bio = args.bio.trim() || undefined
      if (args.username !== undefined)
        updates.username = args.username.trim() || undefined
      if (args.coverImageUrl !== undefined)
        updates.coverImageUrl = args.coverImageUrl || undefined

      await ctx.db.patch(existing._id, updates)
    } else {
      await ctx.db.insert("userProfiles", {
        userId: currentUserId,
        bio: args.bio?.trim() || undefined,
        username: args.username?.trim() || undefined,
        coverImageUrl: args.coverImageUrl || undefined,
      })
    }
  },
})

export const deleteUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await requireAuthUserId(ctx)

    const ownPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", currentUserId))
      .collect()
    await Promise.all(ownPosts.map((post) => ctx.db.delete(post._id)))

    const ownComments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", currentUserId))
      .collect()
    await Promise.all(ownComments.map((comment) => ctx.db.delete(comment._id)))

    const ownLikes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect()
    await Promise.all(ownLikes.map((like) => ctx.db.delete(like._id)))

    const ownSaves = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect()
    await Promise.all(ownSaves.map((save) => ctx.db.delete(save._id)))

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
      .collect()
    await Promise.all(following.map((item) => ctx.db.delete(item._id)))

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", currentUserId))
      .collect()
    await Promise.all(followers.map((item) => ctx.db.delete(item._id)))

    const notificationsForUser = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect()
    await Promise.all(
      notificationsForUser.map((item) => ctx.db.delete(item._id))
    )

    const allNotifications = await ctx.db.query("notifications").collect()
    await Promise.all(
      allNotifications
        .filter((item) => item.actorId === currentUserId)
        .map((item) => ctx.db.delete(item._id))
    )

    const profileDoc = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first()
    if (profileDoc) {
      await ctx.db.delete(profileDoc._id)
    }

    return null
  },
})
