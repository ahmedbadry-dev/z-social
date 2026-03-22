"use client"

import { ArrowLeft, Bell } from "lucide-react"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { NotificationItem } from "@/components/notifications/notification-item"
import { NotificationSkeleton } from "@/components/notifications/notification-skeleton"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"

export function NotificationsMain() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.getNotifications,
    {},
    { initialNumItems: 20 }
  )
  const router = useRouter()
  const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const pendingRequests = useQuery(api.follows.getPendingFollowRequests)
  const acceptRequest = useMutation(api.follows.acceptFollowRequest)
  const rejectRequest = useMutation(api.follows.rejectFollowRequest)

  const hasUnread = (unreadCount ?? 0) > 0
  const isInitialLoading = status === "LoadingFirstPage"

  return (
    <div className="min-h-[calc(100vh-32px)] rounded-lg bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border p-4 md:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <h1 className="text-base font-semibold text-foreground">Notifications</h1>
      </div>

      <div className="hidden items-center justify-between border-b border-border p-4 md:flex">
        <h2 className="text-base font-semibold text-foreground">Notifications</h2>
        {hasUnread && (
          <Button
            type="button"
            variant="ghost"
            className="text-sm text-[#3B55E6] hover:text-[#2E46C4]"
            onClick={() => void markAllAsRead({})}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {isInitialLoading && (
        <div>
          <NotificationSkeleton />
          <NotificationSkeleton />
          <NotificationSkeleton />
        </div>
      )}

      {!isInitialLoading && pendingRequests && pendingRequests.length > 0 && (
        <div className="border-b border-border p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Follow Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req._id} className="flex items-center gap-3">
                <UserAvatar
                  name={req.fromName ?? req.fromUserId}
                  imageUrl={req.fromImage ?? undefined}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {req.fromName ?? req.fromUserId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    wants to follow you
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-[#3B55E6] px-3 py-1 text-xs font-medium text-white hover:bg-[#2D46D6]"
                    onClick={() => void acceptRequest({ fromUserId: req.fromUserId })}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                    onClick={() => void rejectRequest({ fromUserId: req.fromUserId })}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isInitialLoading && results.length === 0 && (!pendingRequests || pendingRequests.length === 0) && (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When someone likes, comments, or follows you, it will appear here"
        />
      )}

      {!isInitialLoading && results.length > 0 && (
        <>
          <div>
            {results.map((notification) => (
              <NotificationItem key={notification._id} notification={notification} />
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center p-4">
              <Button type="button" variant="outline" onClick={() => loadMore(20)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
