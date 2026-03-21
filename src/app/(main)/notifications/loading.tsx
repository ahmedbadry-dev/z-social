import { NotificationSkeleton } from "@/components/notifications/notification-skeleton"

export default function NotificationsLoading() {
  return (
    <div className="rounded-lg bg-card shadow-sm">
      <div className="border-b p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  )
}
