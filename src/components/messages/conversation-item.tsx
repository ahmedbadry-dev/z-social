"use client"
import { useQuery } from "convex/react"
import { UserAvatar } from "@/components/shared/user-avatar"
import { OnlineStatus } from "@/components/shared/online-status"
import { cn, formatRelativeTime } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"

interface ConversationItemProps {
  partnerId: string
  partnerName?: string | null
  partnerImage?: string | null
  lastMessage: string
  lastMessageTime: number
  isLastMessageMine: boolean
  isActive: boolean
  hasUnread?: boolean
  onClick: () => void
}

function truncatePartnerId(partnerId: string) {
  if (partnerId.length <= 16) return partnerId
  return `${partnerId.slice(0, 6)}...${partnerId.slice(-4)}`
}

export function ConversationItem({
  partnerId,
  partnerName,
  partnerImage,
  lastMessage,
  lastMessageTime,
  isLastMessageMine,
  isActive,
  hasUnread = false,
  onClick,
}: ConversationItemProps) {
  const displayName = partnerName?.trim() || truncatePartnerId(partnerId)
  const presence = useQuery(api.messages.getPresence, { userId: partnerId })
  const isOnline = presence?.isOnline ?? false
  const isStatusHidden = presence?.isHidden ?? false

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-muted",
        isActive && "bg-muted"
      )}
    >
      <div className="relative">
        <UserAvatar name={displayName} imageUrl={partnerImage ?? undefined} size="md" />
        {!isStatusHidden && (
          <OnlineStatus
            isOnline={isOnline}
            className="absolute -bottom-0.5 -right-0.5"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm text-foreground",
              hasUnread ? "font-bold" : "font-semibold"
            )}
          >
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(lastMessageTime)}
            </span>
            {/* Blue dot - disappears when conversation is open */}
            {hasUnread && !isActive && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#3B55E6]" />
            )}
          </div>
        </div>
        <p
          className={cn(
            "truncate text-xs",
            hasUnread ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {isLastMessageMine ? "You: " : ""}
          {lastMessage}
        </p>
      </div>
    </button>
  )
}
