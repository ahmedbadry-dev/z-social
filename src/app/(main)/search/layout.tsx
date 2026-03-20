import { SidebarWrapper } from "@/components/layout/sidebar-wrapper"
import { RightPanelWrapper } from "@/components/layout/right-panel-wrapper"
import { preloadAuthQuery } from "@/lib/auth-server"
import { api } from "../../../../convex/_generated/api"

export default async function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUser)

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr] lg:grid-cols-[1fr_2fr_1fr]">
      <SidebarWrapper preloadedUser={preloadedUser} />
      <div className="min-w-0">{children}</div>
      <RightPanelWrapper />
    </div>
  )
}
