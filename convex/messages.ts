import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUserId, requireAuthUserId } from "./helpers"

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return []

    const sent = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", currentUserId))
      .collect()

    const received = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUserId))
      .collect()

    const allMessages = [...sent, ...received]
    const conversationMap = new Map<string, (typeof allMessages)[number]>()

    for (const message of allMessages) {
      const partnerId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId
      const existing = conversationMap.get(partnerId)
      if (!existing || message.createdAt > existing.createdAt) {
        conversationMap.set(partnerId, message)
      }
    }

    const allUnread = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUserId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect()

    const unreadPartners = new Set(allUnread.map((msg) => msg.senderId))

    return await Promise.all(
      Array.from(conversationMap.entries())
        .sort(([, a], [, b]) => b.createdAt - a.createdAt)
        .map(async ([partnerId, lastMessage]) => {
          const partnerDoc = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", partnerId))
            .first()

          return {
            partnerId,
            partnerName: partnerDoc?.name ?? null,
            partnerImage: partnerDoc?.image ?? null,
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.createdAt,
            isLastMessageMine: lastMessage.senderId === currentUserId,
            hasUnread: unreadPartners.has(partnerId),
          }
        })
    )
  },
})

export const getMessages = query({
  args: { otherUserId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return []

    const sent = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", currentUserId).eq("receiverId", args.otherUserId)
      )
      .collect()

    const received = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", args.otherUserId).eq("receiverId", currentUserId)
      )
      .collect()

    const sorted = [...sent, ...received].sort((a, b) => a.createdAt - b.createdAt)

    return Promise.all(
      sorted.map(async (message) => {
        if (!message.replyToId) return { ...message, replyTo: null }
        const replyTo = await ctx.db.get(message.replyToId)
        return {
          ...message,
          replyTo: replyTo
            ? { content: replyTo.content, senderId: replyTo.senderId }
            : null,
        }
      })
    )
  },
})

export const sendMessage = mutation({
  args: {
    receiverId: v.string(),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const content = args.content.trim()

    if (currentUserId === args.receiverId) {
      throw new ConvexError("You cannot message yourself")
    }
    if (!content) {
      throw new ConvexError("Message cannot be empty")
    }
    if (content.length > 1000) {
      throw new ConvexError("Message cannot exceed 1000 characters")
    }

    if (args.replyToId) {
      const replyTo = await ctx.db.get(args.replyToId)
      if (!replyTo) {
        throw new ConvexError("Replied message not found")
      }
    }

    return ctx.db.insert("messages", {
      content,
      senderId: currentUserId,
      receiverId: args.receiverId,
      read: false,
      replyToId: args.replyToId,
      createdAt: Date.now(),
    })
  },
})

export const markConversationAsRead = mutation({
  args: { otherUserId: v.string() },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return 0

    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", args.otherUserId).eq("receiverId", currentUserId)
      )
      .filter((q) => q.eq(q.field("read"), false))
      .collect()

    await Promise.all(
      unread.map((message) => ctx.db.patch(message._id, { read: true }))
    )
    return null
  },
})

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getCurrentUserId(ctx)
    if (!currentUserId) return 0

    const unread = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUserId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect()

    return unread.length
  },
})
