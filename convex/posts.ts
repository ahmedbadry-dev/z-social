import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"
import { getCurrentUserId, requireAuth, requireAuthUserId, sendMentionNotifications } from "./helpers"

type PostDoc = Doc<"posts">

async function buildPostWithMeta(
  ctx: QueryCtx | MutationCtx,
  post: PostDoc,
  currentUserId: string | null
) {
  const allReactions = await ctx.db
    .query("likes")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect()

  const reactionsCount = allReactions.length

  const reactionsSummary = Object.entries(
    allReactions.reduce((acc, reaction) => {
      const type = reaction.reactionType ?? "like"
      acc[type] = (acc[type] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const allComments = await ctx.db
    .query("comments")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect()
  const commentsCount = allComments.filter((comment) => !comment.parentId).length

  const myReactionDoc = currentUserId
    ? await ctx.db
        .query("likes")
        .withIndex("by_post_user", (q) => q.eq("postId", post._id).eq("userId", currentUserId))
        .unique()
    : null

  const myReaction = myReactionDoc ? (myReactionDoc.reactionType ?? "like") : null

  const isSavedByMe = currentUserId
    ? !!(await ctx.db
        .query("saves")
        .withIndex("by_post_user", (q) => q.eq("postId", post._id).eq("userId", currentUserId))
        .unique())
    : false

  return {
    ...post,
    myReaction,
    reactionsCount,
    reactionsSummary,
    commentsCount,
    isSavedByMe,
  }
}

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
    if (currentUserId) {
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
        .collect()
      authorIds = new Set([currentUserId, ...follows.map((f) => f.followingId)])
    }

    const filteredPage = result.page.filter((post) =>
      authorIds.size === 0 ? false : authorIds.has(post.authorId)
    )

    const page = await Promise.all(
      filteredPage.map((post) => buildPostWithMeta(ctx, post, currentUserId))
    )
    return { ...result, page }
  },
})

export const getPostsByUser = query({
  args: { userId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    const result = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts)

    const page = await Promise.all(result.page.map((post) => buildPostWithMeta(ctx, post, currentUserId)))
    return { ...result, page }
  },
})

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    const post = await ctx.db.get(args.postId)
    if (!post) {
      return null
    }
    return buildPostWithMeta(ctx, post, currentUserId)
  },
})

export const getSavedPosts = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)

    const saves = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .order("desc")
      .paginate(args.paginationOpts)

    const page = await Promise.all(
      saves.page.map(async (save) => {
        const post = await ctx.db.get(save.postId)
        if (!post) {
          return null
        }
        return buildPostWithMeta(ctx, post, currentUserId)
      })
    )

    return { ...saves, page: page.filter((item): item is NonNullable<typeof item> => item !== null) }
  },
})

export const getTrendingPosts = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserId(ctx)

    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(100)

    const postsWithMeta = await Promise.all(
      recentPosts.map((post) => buildPostWithMeta(ctx, post, currentUserId))
    )

    return postsWithMeta
      .map((post) => ({
        ...post,
        trendingScore: post.reactionsCount + post.commentsCount * 2,
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 20)
  },
})

export const createPost = mutation({
  args: {
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx)
    const currentUserId = currentUser.userId ?? String(currentUser._id)
    const content = args.content.trim()

    if (!content) {
      throw new ConvexError("Post cannot be empty")
    }
    if (content.length > 500) {
      throw new ConvexError("Post cannot exceed 500 characters")
    }

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", currentUserId))
      .first()

    const postId = await ctx.db.insert("posts", {
      content,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      authorId: currentUserId,
      authorName: userDoc?.name ?? currentUser.name ?? "User",
      authorImage: userDoc?.image ?? currentUser.image ?? undefined,
      createdAt: Date.now(),
    })

    await sendMentionNotifications(ctx, content, currentUserId, postId)
    return postId
  },
})

export const updatePost = mutation({
  args: { postId: v.id("posts"), content: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new ConvexError("Post not found")
    }
    if (post.authorId !== currentUserId) {
      throw new ConvexError("You can only edit your own posts")
    }

    const content = args.content.trim()
    if (!content) {
      throw new ConvexError("Post cannot be empty")
    }
    if (content.length > 500) {
      throw new ConvexError("Post cannot exceed 500 characters")
    }

    await ctx.db.patch(args.postId, {
      content,
      updatedAt: Date.now(),
      isEdited: true,
    })
    return null
  },
})

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new ConvexError("Post not found")
    }
    if (post.authorId !== currentUserId) {
      throw new ConvexError("You can only delete your own posts")
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    await Promise.all(comments.map((comment) => ctx.db.delete(comment._id)))

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
    await Promise.all(likes.map((like) => ctx.db.delete(like._id)))

    const saves = await ctx.db
      .query("saves")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId))
      .collect()
    await Promise.all(saves.map((save) => ctx.db.delete(save._id)))

    await ctx.db.delete(args.postId)
    return null
  },
})

export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    reactionType: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("haha"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    ),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new ConvexError("Post not found")
    }

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", currentUserId))
      .unique()

    if (existing) {
      const existingType = existing.reactionType ?? "like"
      if (existingType === args.reactionType) {
        await ctx.db.delete(existing._id)
      } else {
        await ctx.db.patch(existing._id, { reactionType: args.reactionType })
      }
    } else {
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: currentUserId,
        reactionType: args.reactionType,
        createdAt: Date.now(),
      })

      if (post.authorId !== currentUserId) {
        await ctx.db.insert("notifications", {
          userId: post.authorId,
          actorId: currentUserId,
          type: "like",
          postId: args.postId,
          read: false,
          createdAt: Date.now(),
        })
      }
    }
  },
})

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new ConvexError("Post not found")
    }

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", currentUserId))
      .unique()

    if (existing) {
      const existingType = existing.reactionType ?? "like"
      if (existingType === "like") {
        await ctx.db.delete(existing._id)
      } else {
        await ctx.db.patch(existing._id, { reactionType: "like" })
      }
    } else {
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: currentUserId,
        reactionType: "like",
        createdAt: Date.now(),
      })

      if (post.authorId !== currentUserId) {
        await ctx.db.insert("notifications", {
          userId: post.authorId,
          actorId: currentUserId,
          type: "like",
          postId: args.postId,
          read: false,
          createdAt: Date.now(),
        })
      }
    }
  },
})

export const toggleSave = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)

    const existing = await ctx.db
      .query("saves")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", currentUserId))
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
      return { saved: false }
    }

    await ctx.db.insert("saves", {
      postId: args.postId,
      userId: currentUserId,
      createdAt: Date.now(),
    })
    return { saved: true }
  },
})
