import { SidebarWrapper } from "@/components/layout/sidebar-wrapper"

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr]">
      <SidebarWrapper />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
