"use client"

import { useQuery } from "convex/react"
import { ConversationItem } from "@/components/messages/conversation-item"
import { api } from "../../../convex/_generated/api"
import { PenSquare } from "lucide-react"
import { useRouter } from "next/navigation"

interface ConversationListProps {
  selectedUserId: string | null
  onSelect: (userId: string) => void
}

export function ConversationList({ selectedUserId, onSelect }: ConversationListProps) {
  const conversations = useQuery(api.messages.getConversations)
  const router = useRouter()

  return (
    <aside className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-base font-semibold text-foreground">Messages</h2>
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="New message"
        >
          <PenSquare className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {conversations === undefined && (
          <div className="space-y-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md p-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {conversations && conversations.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">No conversations yet</p>
        )}

        {conversations?.map((conversation) => (
          <ConversationItem
            key={conversation.partnerId}
            partnerId={conversation.partnerId}
            partnerName={conversation.partnerName}
            partnerImage={conversation.partnerImage}
            lastMessage={conversation.lastMessage}
            lastMessageTime={conversation.lastMessageTime}
            isLastMessageMine={conversation.isLastMessageMine}
            hasUnread={conversation.hasUnread}
            isActive={selectedUserId === conversation.partnerId}
            onClick={() => onSelect(conversation.partnerId)}
          />
        ))}
      </div>
    </aside>
  )
}
