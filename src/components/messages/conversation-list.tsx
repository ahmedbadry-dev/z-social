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
    <aside className="flex h-full flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <h2 className="text-base font-semibold text-[#0F172A]">Messages</h2>
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
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
                <div className="h-10 w-10 animate-pulse rounded-full bg-[#E2E8F0]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#E2E8F0]" />
                  <div className="h-3 w-32 animate-pulse rounded bg-[#E2E8F0]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {conversations && conversations.length === 0 && (
          <p className="p-3 text-sm text-[#64748B]">No conversations yet</p>
        )}

        {conversations?.map((conversation) => (
          <ConversationItem
            key={conversation.partnerId}
            partnerId={conversation.partnerId}
            lastMessage={conversation.lastMessage}
            lastMessageTime={conversation.lastMessageTime}
            isLastMessageMine={conversation.isLastMessageMine}
            hasUnread={conversation.hasUnread}  // ← أضف هذا
            isActive={selectedUserId === conversation.partnerId}
            onClick={() => onSelect(conversation.partnerId)}
          />
        ))}
      </div>
    </aside>
  )
}
