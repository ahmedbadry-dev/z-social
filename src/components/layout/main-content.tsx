"use client"

import { SidebarWrapper } from "./sidebar-wrapper"
import { RightPanelWrapper } from "./right-panel-wrapper"

export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr] lg:grid-cols-[1fr_3fr_1fr] ">
      <SidebarWrapper />
      <div className="min-w-0">{children}</div>
      <RightPanelWrapper />
    </div>
  )
}
