"use client"

import { Bell } from "lucide-react"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { NotificationItem } from "@/components/notifications/notification-item"
import { NotificationSkeleton } from "@/components/notifications/notification-skeleton"
import { api } from "../../../convex/_generated/api"

export function NotificationsMain() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.getNotifications,
    {},
    { initialNumItems: 20 }
  )
  const unreadCount = useQuery(api.notifications.getUnreadNotificationsCount)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  const hasUnread = (unreadCount ?? 0) > 0
  const isInitialLoading = status === "LoadingFirstPage"

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <h2 className="text-base font-semibold text-[#0F172A]">Notifications</h2>
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

      {!isInitialLoading && results.length === 0 && (
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
