import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUserId, requireAuthUserId, sendMentionNotifications } from "./helpers"

export const getCommentsByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("parentId"), undefined))
      .order("asc")
      .collect()

    return comments
  },
})

export const getRepliesByComment = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .order("asc")
      .collect()

    return replies
  },
})

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const content = args.content.trim()

    if (!content) {
      throw new ConvexError("Comment cannot be empty")
    }
    if (content.length > 500) {
      throw new ConvexError("Comment cannot exceed 500 characters")
    }

    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new ConvexError("Post not found")
    }

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", currentUserId))
      .first()

    const commentId = await ctx.db.insert("comments", {
      content,
      postId: args.postId,
      authorId: currentUserId,
      parentId: args.parentId,
      authorName: userDoc?.name ?? undefined,
      authorImage: userDoc?.image ?? undefined,
      createdAt: Date.now(),
    })

    await sendMentionNotifications(ctx, content, currentUserId, args.postId, commentId)

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId)
      if (parent && parent.authorId !== currentUserId) {
        await ctx.db.insert("notifications", {
          userId: parent.authorId,
          actorId: currentUserId,
          type: "reply",
          postId: args.postId,
          commentId,
          read: false,
          createdAt: Date.now(),
        })
      }
    } else if (post.authorId !== currentUserId) {
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        actorId: currentUserId,
        type: "comment",
        postId: args.postId,
        commentId,
        read: false,
        createdAt: Date.now(),
      })
    }

    return commentId
  },
})

export const toggleCommentLike = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment_user", (q) =>
        q.eq("commentId", args.commentId).eq("userId", currentUserId)
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
      return { liked: false }
    }

    await ctx.db.insert("commentLikes", {
      commentId: args.commentId,
      userId: currentUserId,
      createdAt: Date.now(),
    })
    return { liked: true }
  },
})

export const getCommentLikes = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx)

    const likes = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect()

    const isLikedByMe = userId ? likes.some((like) => like.userId === userId) : false

    return { count: likes.length, isLikedByMe }
  },
})

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const comment = await ctx.db.get(args.commentId)

    if (!comment) {
      throw new ConvexError("Comment not found")
    }
    if (comment.authorId !== currentUserId) {
      throw new ConvexError("You can only delete your own comments")
    }

    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .collect()
    await Promise.all(replies.map((reply) => ctx.db.delete(reply._id)))

    await ctx.db.delete(args.commentId)
    return null
  },
})
