"use client"

import { MessageSquare } from "lucide-react"
import { useState } from "react"
import { useQuery } from "convex/react"
import { useQueryState } from "nuqs"
import { ChatWindow } from "@/components/messages/chat-window"
import { ConversationList } from "@/components/messages/conversation-list"
import { EmptyState } from "@/components/shared/empty-state"
import { api } from "../../../convex/_generated/api"

export function MessagesMain() {
  const [userIdParam] = useQueryState("userId")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userIdParam)
  const currentUser = useQuery(api.auth.getCurrentUser)
  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")

  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-sm" style={{ height: "calc(100vh - 161px)" }}>
      <div className="flex h-full">

        <div className={`${selectedUserId ? "hidden md:block" : "block"} w-full md:w-[280px] md:shrink-0`}>
          <ConversationList
            selectedUserId={selectedUserId}
            onSelect={(userId) => setSelectedUserId(userId)}
          />
        </div>

        <div className={`${selectedUserId ? "block" : "hidden md:flex"} min-w-0 flex-1`}>
          {selectedUserId ? (
            <ChatWindow
              otherUserId={selectedUserId}
              currentUserId={currentUserId}
              onBack={() => setSelectedUserId(null)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation to start messaging"
                description="Choose a chat from the list and start talking."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
