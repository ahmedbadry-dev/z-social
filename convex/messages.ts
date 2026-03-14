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

    return Array.from(conversationMap.entries())
      .sort(([, a], [, b]) => b.createdAt - a.createdAt)
      .map(([partnerId, lastMessage]) => ({
        partnerId,
        lastMessage: lastMessage.content,
        lastMessageTime: lastMessage.createdAt,
        isLastMessageMine: lastMessage.senderId === currentUserId,
      }))
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

    return [...sent, ...received].sort((a, b) => a.createdAt - b.createdAt)
  },
})

export const sendMessage = mutation({
  args: { receiverId: v.string(), content: v.string() },
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

    return ctx.db.insert("messages", {
      content,
      senderId: currentUserId,
      receiverId: args.receiverId,
      read: false,
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
