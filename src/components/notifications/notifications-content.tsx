"use client"

import { Authenticated, AuthLoading } from "convex/react"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { NotificationsMain } from "@/components/notifications/notifications-main"

export function NotificationsContent() {
  return (
    <div className="space-y-4 py-4">
      <AuthLoading>
        <PostSkeleton />
        <PostSkeleton />
      </AuthLoading>
      <Authenticated>
        <NotificationsMain />
      </Authenticated>
    </div>
  )
}
