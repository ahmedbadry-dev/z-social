"use client"

import { cn, formatRelativeTime } from "@/lib/utils"

interface MessageBubbleProps {
  content: string
  createdAt: number
  isSent: boolean
  isOptimistic?: boolean
}

export function MessageBubble({
  content,
  createdAt,
  isSent,
  isOptimistic,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex", isSent ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[70%]", isOptimistic && "opacity-60")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isSent
              ? "rounded-br-sm bg-[#3B55E6] text-white"
              : "rounded-bl-sm border border-border bg-card text-foreground"
          )}
        >
          {content}
        </div>
        <p
          className={cn(
            "mt-1 text-xs text-muted-foreground",
            isSent ? "text-right" : "text-left"
          )}
        >
          {isOptimistic ? "Sending..." : formatRelativeTime(createdAt)}
        </p>
      </div>
    </div>
  )
}
