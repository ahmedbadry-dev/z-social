"use client"
import { UserAvatar } from "@/components/shared/user-avatar"
import { cn, formatRelativeTime } from "@/lib/utils"

interface ConversationItemProps {
  partnerId: string
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
  lastMessage,
  lastMessageTime,
  isLastMessageMine,
  isActive,
  hasUnread = false,
  onClick,
}: ConversationItemProps) {
  const displayName = truncatePartnerId(partnerId)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-[#F8FAFC]",
        isActive && "bg-[#F1F5F9]"
      )}
    >
      <UserAvatar name={displayName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "truncate text-sm text-[#0F172A]",
            hasUnread ? "font-bold" : "font-semibold"
          )}>
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-[#64748B]">
              {formatRelativeTime(lastMessageTime)}
            </span>
            {/* Blue dot — disappears when conversation is open */}
            {hasUnread && !isActive && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#3B55E6]" />
            )}
          </div>
        </div>
        <p className={cn(
          "truncate text-xs",
          hasUnread ? "font-medium text-[#0F172A]" : "text-[#64748B]"
        )}>
          {isLastMessageMine ? "You: " : ""}
          {lastMessage}
        </p>
      </div>
    </button>
  )
}