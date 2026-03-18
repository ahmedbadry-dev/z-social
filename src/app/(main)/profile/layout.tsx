import { SidebarWrapper } from "@/components/layout/sidebar-wrapper"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr]">
      <SidebarWrapper />
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  )
}
