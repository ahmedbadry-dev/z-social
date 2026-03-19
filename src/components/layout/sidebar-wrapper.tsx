"use client"

import { Authenticated, AuthLoading } from "convex/react"
import { Sidebar } from "./sidebar"

function SidebarSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-sm">
      <div className="h-20 bg-muted" />
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-3 size-12 animate-pulse rounded-full bg-muted" />
        <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export function SidebarWrapper() {
  return (
    <aside className="hidden md:block">
      <AuthLoading>
        <SidebarSkeleton />
      </AuthLoading>
      <Authenticated>
        <Sidebar />
      </Authenticated>
    </aside>
  )
}
