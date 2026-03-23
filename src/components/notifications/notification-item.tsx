"use client"

import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { Trash2 } from "lucide-react"
import { useMutation } from "convex/react"
import { useRef } from "react"
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
  onDelete: (id: Id<"notifications">) => void
  onUndo?: (id: Id<"notifications">) => void
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

export function NotificationItem({ notification, onDelete, onUndo }: NotificationItemProps) {
  const markAsRead = useMutation(api.notifications.markAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)
  const text = getNotificationText(
    notification.type,
    notification.actorName,
    notification.actorId
  )

  const dragDistance = useMotionValue(0)
  const opacity = useTransform(dragDistance, [-160, -80, 0, 80, 160], [0, 1, 1, 1, 0])
  const redOpacity = useTransform(dragDistance, [-150, -60, 0, 60, 150], [1, 0.6, 0, 0.6, 1])
  const trashScale = useTransform(dragDistance, [-150, -60, 0, 60, 150], [1.2, 1, 0.8, 1, 1.2])
  const leftOpacity = useTransform(dragDistance, [0, 60, 150], [0, 0.6, 1])
  const rightOpacity = useTransform(dragDistance, [-150, -60, 0], [1, 0.6, 0])
  const dragRef = useRef(false)
  const undoRef = useRef(false)
  const commitRef = useRef(false)

  const handleMarkAsRead = async () => {
    if (dragRef.current) return
    try {
      await markAsRead({ notificationId: notification._id })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update notification"
      toast.error(message)
    }
  }

  const commitDelete = async () => {
    if (undoRef.current || commitRef.current) return
    commitRef.current = true
    try {
      await deleteNotification({ notificationId: notification._id })
    } catch {
      toast.error("Failed to delete notification")
    }
  }

  const handleSwipeDelete = async () => {
    onDelete(notification._id)
    undoRef.current = false
    commitRef.current = false

    toast("Notification deleted", {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          undoRef.current = true
          onUndo?.(notification._id)
        },
      },
      onDismiss: () => {
        void commitDelete()
      },
      onAutoClose: () => {
        void commitDelete()
      },
    })
  }

  const handleDragEnd = async (_: unknown, info: { offset: { x: number } }) => {
    dragRef.current = false
    const threshold = 90
    if (Math.abs(info.offset.x) > threshold) {
      await animate(dragDistance, info.offset.x > 0 ? 420 : -420, {
        duration: 0.25,
        ease: "easeOut",
      })
      await handleSwipeDelete()
    } else {
      await animate(dragDistance, 0, { type: "spring", stiffness: 500, damping: 35 })
    }
  }

  return (
    <div className="relative overflow-hidden">
      <motion.div style={{ opacity: redOpacity }} className="absolute inset-0 bg-destructive/10" />
      <div className="absolute inset-0 flex items-center justify-between rounded-none px-5">
        <motion.div style={{ opacity: leftOpacity }} className="flex items-center gap-2">
          <motion.div style={{ scale: trashScale }}>
            <Trash2 className="size-5 text-destructive" />
          </motion.div>
        </motion.div>
        <motion.div style={{ opacity: rightOpacity }} className="flex items-center gap-2">
          <motion.div style={{ scale: trashScale }}>
            <Trash2 className="size-5 text-destructive" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        style={{ x: dragDistance, opacity }}
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.15}
        onDragStart={() => {
          dragRef.current = true
        }}
        onDragEnd={handleDragEnd}
        className="relative cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          className={cn(
            "relative flex w-full items-center gap-3 border-b border-border bg-card p-4 text-left transition-colors",
            notification.read ? "bg-card" : "bg-muted"
          )}
          onClick={() => void handleMarkAsRead()}
        >
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
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
    </div>
  )
}
