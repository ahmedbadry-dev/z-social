import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"
import { getCurrentUserId, requireAuth, requireAuthUserId } from "./helpers"

type PostDoc = Doc<"posts">

async function buildPostWithMeta(
  ctx: QueryCtx | MutationCtx,
  post: PostDoc,
  currentUserId: string | null
) {
  const likesCount = await ctx.db
    .query("likes")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect()
    .then((rows: Doc<"likes">[]) => rows.length)

  const commentsCount = await ctx.db
    .query("comments")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect()
    .then((rows: Doc<"comments">[]) => rows.length)

  const isLikedByMe = currentUserId
    ? !!(await ctx.db
        .query("likes")
        .withIndex("by_post_user", (q) => q.eq("postId", post._id).eq("userId", currentUserId))
        .unique())
    : false

  const isSavedByMe = currentUserId
    ? !!(await ctx.db
        .query("saves")
        .withIndex("by_post_user", (q) => q.eq("postId", post._id).eq("userId", currentUserId))
        .unique())
    : false

  return {
    ...post,
    likesCount,
    commentsCount,
    isLikedByMe,
    isSavedByMe,
  }
}

export const getFeedPosts = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)

    let authorIds: string[] = []
    if (currentUserId) {
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", currentUserId))
        .collect()
      authorIds = [currentUserId, ...follows.map((f) => f.followingId)]
    }

    const result = await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .filter((q) => {
        if (authorIds.length === 0) {
          return q.eq(q.field("authorId"), "")
        }
        if (authorIds.length === 1) {
          return q.eq(q.field("authorId"), authorIds[0])
        }
        return q.or(...authorIds.map((id) => q.eq(q.field("authorId"), id)))
      })
      .paginate(args.paginationOpts)

    const page = await Promise.all(result.page.map((post) => buildPostWithMeta(ctx, post, currentUserId)))
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

    return ctx.db.insert("posts", {
      content,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      authorId: currentUserId,
      authorName: currentUser.name ?? "User",
      authorImage: currentUser.image ?? undefined,
      createdAt: Date.now(),
    })
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
      await ctx.db.delete(existing._id)
    } else {
        await ctx.db.insert("likes", {
          postId: args.postId,
          userId: currentUserId,
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

    const likesCount = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()
      .then((rows) => rows.length)

    return { liked: !existing, likesCount }
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
