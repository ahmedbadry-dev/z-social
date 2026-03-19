import { v } from "convex/values"
import { query, type QueryCtx } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"
import { getCurrentUserId } from "./helpers"

type PostDoc = Doc<"posts">

async function buildPostWithMeta(
  ctx: QueryCtx,
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

  const commentsCount = await ctx.db
    .query("comments")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect()
    .then((rows) => rows.length)

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

export const searchPosts = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    if (args.q.trim().length < 2) {
      return []
    }

    const currentUserId = await getCurrentUserId(ctx)

    const posts = await ctx.db
      .query("posts")
      .withSearchIndex("search_content", (q) => q.search("content", args.q.trim()))
      .take(10)

    return Promise.all(posts.map((post) => buildPostWithMeta(ctx, post, currentUserId)))
  },
})

export const searchUsers = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    if (args.q.trim().length < 2) {
      return []
    }

    const currentUserId = await getCurrentUserId(ctx)

    const byUsername = await ctx.db
      .query("userProfiles")
      .withSearchIndex("search_username", (q) => q.search("username", args.q.trim()))
      .take(5)

    return byUsername.map((profile) => ({
      userId: profile.userId,
      username: profile.username,
      bio: profile.bio,
      isCurrentUser: profile.userId === currentUserId,
    }))
  },
})
