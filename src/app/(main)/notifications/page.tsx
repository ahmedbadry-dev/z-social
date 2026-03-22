import { NotificationsContent } from "@/components/notifications/notifications-content"
import { PageTransition } from "@/components/shared/page-transition"

export const metadata = { title: "Notifications | Z-Social" }

export default function NotificationsPage() {
  return (
    <PageTransition>
      <NotificationsContent />
    </PageTransition>
  )
}
