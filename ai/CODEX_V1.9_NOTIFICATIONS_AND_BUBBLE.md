# Feat: Image-only bubble fix + Swipeable notifications with undo
# Branch: v1.9/phase-3-network-expansion (or new branch)

---

## READ FIRST
- `src/components/messages/message-bubble.tsx`
- `src/components/notifications/notification-item.tsx`
- `src/components/notifications/notifications-main.tsx`
- `convex/notifications.ts`

---

## CHANGE 1 — message-bubble.tsx: Remove blue background for image-only messages

**Problem:** When a message has an image but NO text content, it still renders
the blue background wrapper (`bg-[#3B55E6]`) which looks ugly behind an image.

**Fix:** When the message has an image and no text content, render the image
directly without the colored background wrapper:

```tsx
// Detect image-only message:
const isImageOnly = !!imageUrl && !content

return (
  <motion.div ...>
    <div className={cn("max-w-[70%]", isOptimistic && "opacity-70")}>
      
      {isImageOnly ? (
        // Image-only: no colored background, just the image with rounded corners
        <div className={cn(isSent ? sentRadius : receivedRadius, "overflow-hidden")}>
          <div className="relative">
            <img
              src={imageUrl}
              alt="Shared image"
              className={cn(
                "max-h-60 w-full object-cover",
                isUploading && "opacity-60"
              )}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="size-5" />
                </button>
              </div>
            )}
            {uploadFailed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                <AlertCircle className="size-6 text-destructive" />
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/30"
                >
                  <RotateCcw className="size-3" />
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Normal message with background (existing code unchanged)
        <div
          className={cn(
            "px-3.5 py-2 text-sm",
            isSent
              ? cn(sentRadius, "bg-[#3B55E6] text-white")
              : cn(receivedRadius, "border border-border bg-card text-foreground")
          )}
        >
          {imageUrl && (
            <div className="relative mb-1">
              <img
                src={imageUrl}
                alt="Shared image"
                className={cn("max-h-60 w-full rounded-xl object-cover", isUploading && "opacity-60")}
              />
              {/* ... uploading/failed states unchanged ... */}
            </div>
          )}
          {content && <p className="text-sm leading-relaxed">{content}</p>}
          {uploadFailed && !imageUrl && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3" />
              Failed to send
            </div>
          )}
        </div>
      )}

      {/* Time + read receipt — unchanged */}
      {isLastInGroup && ( ... )}
    </div>
  </motion.div>
)
```

Write the complete file — do not use shortcuts or `// ... unchanged`.

---

## CHANGE 2 — convex/notifications.ts: Add delete mutations

Add these two mutations at the end of the file:

```typescript
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx)
    const notification = await ctx.db.get(args.notificationId)
    if (!notification) throw new ConvexError("Notification not found")
    if (notification.userId !== currentUserId) throw new ConvexError("Unauthorized")
    await ctx.db.delete(args.notificationId)
  },
})

export const clearAllNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await requireAuthUserId(ctx)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .collect()
    await Promise.all(notifications.map((n) => ctx.db.delete(n._id)))
  },
})
```

---

## CHANGE 3 — notification-item.tsx: Add swipe-to-delete with undo toast

**How it works:**
- User swipes left or right on a notification → it slides out and gets deleted
- A toast appears immediately with an "Undo" button
- If user clicks Undo within the toast duration → notification is NOT deleted
  (we use optimistic removal: hide immediately, delete only if not undone)
- `sonner` toast already supports action buttons

**Implementation:**

```tsx
"use client"

import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { useRef, useState } from "react"
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
  onDelete: (id: Id<"notifications">) => void
}

function getNotificationText(
  type: string,
  actorName: string | null | undefined,
  actorId: string
): string {
  const actor = actorName?.trim() || (actorId.length > 10 ? `${actorId.slice(0, 8)}...` : actorId)
  switch (type) {
    case "like": return `${actor} liked your post`
    case "comment": return `${actor} commented on your post`
    case "reply": return `${actor} replied to your comment`
    case "follow": return `${actor} started following you`
    case "mention": return `${actor} mentioned you in a post`
    case "follow_request": return `${actor} requested to follow you`
    case "follow_accept": return `${actor} accepted your follow request`
    default: return "New notification"
  }
}

export function NotificationItem({ notification, onDelete }: NotificationItemProps) {
  const markAsRead = useMutation(api.notifications.markAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)
  const text = getNotificationText(notification.type, notification.actorName, notification.actorId)

  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, -60, 0, 60, 150], [0, 1, 1, 1, 0])
  const dragRef = useRef(false)
  const undoRef = useRef(false)

  const handleMarkAsRead = async () => {
    if (dragRef.current) return
    try {
      await markAsRead({ notificationId: notification._id })
    } catch {
      toast.error("Failed to update notification")
    }
  }

  const handleSwipeDelete = async () => {
    // Optimistically hide
    onDelete(notification._id)
    undoRef.current = false

    toast("Notification deleted", {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          undoRef.current = true
          // Undo is handled by parent — parent restores the notification
          // We signal this via a custom event or callback
          // For simplicity: reload will restore from DB if not deleted yet
        },
      },
      onDismiss: async () => {
        if (!undoRef.current) {
          try {
            await deleteNotification({ notificationId: notification._id })
          } catch {
            toast.error("Failed to delete notification")
          }
        }
      },
      onAutoClose: async () => {
        if (!undoRef.current) {
          try {
            await deleteNotification({ notificationId: notification._id })
          } catch {
            toast.error("Failed to delete notification")
          }
        }
      },
    })
  }

  const handleDragEnd = async (_: unknown, info: { offset: { x: number } }) => {
    dragRef.current = false
    const threshold = 80
    if (Math.abs(info.offset.x) > threshold) {
      // Animate out
      await animate(x, info.offset.x > 0 ? 400 : -400, { duration: 0.2 })
      await handleSwipeDelete()
    } else {
      // Snap back
      await animate(x, 0, { type: "spring", stiffness: 400, damping: 30 })
    }
  }

  return (
    <motion.div
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: -150, right: 150 }}
      dragElastic={0.2}
      onDragStart={() => { dragRef.current = true }}
      onDragEnd={handleDragEnd}
      className="relative cursor-grab active:cursor-grabbing"
    >
      {/* Swipe hint backgrounds */}
      <div className="absolute inset-0 flex items-center justify-end px-4 bg-destructive/10 rounded">
        <span className="text-xs font-medium text-destructive">Delete</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-start px-4 bg-destructive/10 rounded">
        <span className="text-xs font-medium text-destructive">Delete</span>
      </div>

      <button
        type="button"
        className={cn(
          "relative flex w-full items-center gap-3 border-b border-border p-4 text-left transition-colors bg-card",
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
  )
}
```

---

## CHANGE 4 — notifications-main.tsx: Add onDelete handler + Clear All button

**Add optimistic delete state:**
```tsx
const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
const clearAllNotifications = useMutation(api.notifications.clearAllNotifications)

const handleDelete = (id: Id<"notifications">) => {
  setDeletedIds((prev) => new Set([...prev, id]))
}

const handleClearAll = async () => {
  try {
    await clearAllNotifications()
    toast.success("All notifications cleared")
  } catch {
    toast.error("Failed to clear notifications")
  }
}
```

**Filter out deleted notifications:**
```tsx
const visibleResults = results.filter((n) => !deletedIds.has(n._id))
```

**Add Clear All button in the header** (next to "Mark all as read"):
```tsx
<Button
  type="button"
  variant="ghost"
  className="text-sm text-muted-foreground hover:text-foreground"
  onClick={() => void handleClearAll()}
>
  Clear all
</Button>
```

**Pass onDelete to NotificationItem:**
```tsx
<NotificationItem
  key={notification._id}
  notification={notification}
  onDelete={handleDelete}
/>
```

---

## FILES TO CHANGE
- `src/components/messages/message-bubble.tsx`
- `convex/notifications.ts`
- `src/components/notifications/notification-item.tsx`
- `src/components/notifications/notifications-main.tsx`

## DO NOT TOUCH
- `src/components/ui/*`
- `src/proxy.ts`
- `src/lib/auth-server.ts`

## AFTER CHANGES
1. Run `npm run build`
2. Fix TypeScript errors — pay attention to:
   - `onDelete` prop added to `NotificationItemProps`
   - `useState` import in notifications-main.tsx
   - `Id<"notifications">` type in the Set

## COMPLETION FORMAT
```
✅ Image-only bubble fix + swipeable notifications with undo
Files changed:
- src/components/messages/message-bubble.tsx
- convex/notifications.ts
- src/components/notifications/notification-item.tsx
- src/components/notifications/notifications-main.tsx
Build: passed
```
