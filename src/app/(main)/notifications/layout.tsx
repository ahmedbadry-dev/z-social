import { SidebarWrapper } from "@/components/layout/sidebar-wrapper"
import { RightPanelWrapper } from "@/components/layout/right-panel-wrapper"

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr] lg:grid-cols-[1fr_2fr_1fr]">
      <SidebarWrapper />
      <div className="min-w-0">{children}</div>
      <RightPanelWrapper />
    </div>
  )
}
