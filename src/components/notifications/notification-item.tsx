"use client"

import { motion } from "motion/react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import type { Id } from "../../../convex/_generated/dataModel"
import { UserAvatar } from "@/components/shared/user-avatar"
import { cn, formatRelativeTime } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">
    type: "like" | "comment" | "reply" | "follow" | "mention" | "follow_request" | "follow_accept"
    actorId: string
    actorName?: string | null
    actorImage?: string | null
    postId?: Id<"posts">
    read: boolean
    createdAt: number
  }
}

function getNotificationText(
  type: string,
  actorName: string | null | undefined,
  actorId: string
): string {
  const actor = actorName?.trim() || (actorId.length > 10 ? `${actorId.slice(0, 8)}...` : actorId)
  switch (type) {
    case "like":
      return `${actor} liked your post`
    case "comment":
      return `${actor} commented on your post`
    case "reply":
      return `${actor} replied to your comment`
    case "follow":
      return `${actor} started following you`
    case "mention":
      return `${actor} mentioned you in a post`
    case "follow_request":
      return `${actor} requested to follow you`
    case "follow_accept":
      return `${actor} accepted your follow request`
    default:
      return "New notification"
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useMutation(api.notifications.markAsRead)
  const text = getNotificationText(
    notification.type,
    notification.actorName,
    notification.actorId
  )

  const handleMarkAsRead = async () => {
    try {
      await markAsRead({ notificationId: notification._id })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update notification"
      toast.error(message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 border-b border-border p-4 text-left transition-colors",
          notification.read ? "bg-card" : "bg-muted"
        )}
        onClick={() => void handleMarkAsRead()}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            notification.read ? "bg-transparent" : "bg-[#3B55E6]"
          )}
        />
        <UserAvatar
          name={notification.actorName ?? notification.actorId}
          imageUrl={notification.actorImage ?? undefined}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">{text}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </button>
    </motion.div>
  )
}
