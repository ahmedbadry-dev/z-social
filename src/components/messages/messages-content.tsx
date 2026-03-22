"use client"

import { Authenticated, AuthLoading } from "convex/react"
import { MessagesMain } from "@/components/messages/messages-main"

function MessagesLoading() {
  return (
    <div className="min-h-[600px] rounded-lg bg-card p-4 shadow-sm">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <div className="space-y-3 rounded-lg bg-muted p-4">
          <div className="h-5 w-24 animate-pulse rounded bg-muted-foreground/20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted-foreground/20" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-muted-foreground/20" />
                <div className="h-3 w-36 animate-pulse rounded bg-muted-foreground/20" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export function MessagesContent() {
  return (
    <div className="space-y-4">
      <AuthLoading>
        <MessagesLoading />
      </AuthLoading>
      <Authenticated>
        <MessagesMain />
      </Authenticated>
    </div>
  )
}
