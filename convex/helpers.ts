import { ConvexError } from "convex/values"
import type { Id } from "./_generated/dataModel"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { authComponent } from "./auth"

type Ctx = QueryCtx | MutationCtx

export async function getCurrentUser(ctx: Ctx) {
  try {
    return await authComponent.getAuthUser(ctx)
  } catch {
    return null
  }
}

function pickUserId(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
) {
  return user.userId ?? String(user._id)
}

export async function getCurrentUserId(ctx: Ctx) {
  const user = await getCurrentUser(ctx)
  if (!user) {
    return null
  }
  return pickUserId(user)
}

export async function requireAuth(ctx: Ctx) {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new ConvexError("Unauthorized")
  }
  return user
}

export async function requireAuthUserId(ctx: Ctx) {
  const user = await requireAuth(ctx)
  return pickUserId(user)
}

export async function getUserById(ctx: Ctx, userId: string) {
  return ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first()
}

export async function sendMentionNotifications(
  ctx: MutationCtx,
  content: string,
  actorId: string,
  postId: Id<"posts">,
  commentId?: Id<"comments">
) {
  const mentionRegex = /@(\w+)/g
  const mentions = [...content.matchAll(mentionRegex)].map((match) => match[1])
  if (mentions.length === 0) return

  const uniqueMentions = new Set(mentions)

  for (const username of uniqueMentions) {
    const profile = await ctx.db
      .query("userProfiles")
      .withSearchIndex("search_username", (q) => q.search("username", username))
      .first()

    if (!profile || profile.userId === actorId) continue

    await ctx.db.insert("notifications", {
      userId: profile.userId,
      actorId,
      type: "mention",
      postId,
      commentId,
      read: false,
      createdAt: Date.now(),
    })
  }
}
