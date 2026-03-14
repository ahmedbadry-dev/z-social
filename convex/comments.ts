import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAuthUserId } from "./helpers"

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
    return ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .order("asc")
      .collect()
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
    if (content.length > 300) {
      throw new ConvexError("Comment cannot exceed 300 characters")
    }

    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new ConvexError("Post not found")
    }

    const commentId = await ctx.db.insert("comments", {
      content,
      postId: args.postId,
      authorId: currentUserId,
      parentId: args.parentId,
      createdAt: Date.now(),
    })

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
