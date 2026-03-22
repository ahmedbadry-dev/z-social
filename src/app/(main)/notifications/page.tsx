import { NotificationsContent } from "@/components/notifications/notifications-content"
import { PageTransition } from "@/components/shared/page-transition"

export const metadata = { title: "Notifications" }

export default function NotificationsPage() {
  return (
    <PageTransition>
      <NotificationsContent />
    </PageTransition>
  )
}
