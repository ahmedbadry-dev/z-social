"use client"
import { cn, formatRelativeTime } from "@/lib/utils"

interface MessageBubbleProps {
  content: string
  createdAt: number
  isSent: boolean
  isOptimistic?: boolean
  replyTo?: { content: string; senderId: string } | null
  currentUserId?: string
}

export function MessageBubble({
  content,
  createdAt,
  isSent,
  isOptimistic,
  replyTo,
  currentUserId,
}: MessageBubbleProps) {
  const replyAuthor =
    replyTo && currentUserId
      ? replyTo.senderId === currentUserId
        ? "You"
        : "Them"
      : null

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
          {replyTo && (
            <div
              className={cn(
                "mb-2 rounded-md border-l-2 px-2 py-1 text-xs opacity-80",
                isSent
                  ? "border-white/50 bg-white/10 text-white/90"
                  : "border-[#3B55E6]/50 bg-muted text-foreground"
              )}
            >
              {replyAuthor && <p className="mb-0.5 text-[10px]">{replyAuthor}</p>}
              <p className="truncate">
                {replyTo.content.slice(0, 60)}
                {replyTo.content.length > 60 ? "..." : ""}
              </p>
            </div>
          )}
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
