import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAuthUserId } from "./helpers"

export const getNotifications = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    return ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .order("desc")
      .paginate(args.paginationOpts)
  },
})

export const getUnreadNotificationsCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await requireAuthUserId(ctx)
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", currentUserId).eq("read", false))
      .collect()
    return unread.length
  },
})

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await requireAuthUserId(ctx)
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", currentUserId).eq("read", false))
      .collect()

    await Promise.all(unread.map((notification) => ctx.db.patch(notification._id, { read: true })))
    return null
  },
})

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const notification = await ctx.db.get(args.notificationId)
    if (!notification || notification.userId !== currentUserId) {
      return null
    }

    await ctx.db.patch(args.notificationId, { read: true })
    return null
  },
})
