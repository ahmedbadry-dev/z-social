"use client"

import { Authenticated } from "convex/react"
import { RightPanel } from "./right-panel"

export function RightPanelWrapper() {
  return (
    <aside className="hidden lg:block">
      <Authenticated>
        <RightPanel />
      </Authenticated>
    </aside>
  )
}
