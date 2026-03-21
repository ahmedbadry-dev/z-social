"use client"
import { ArrowLeft, Reply } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { MessageBubble } from "@/components/messages/message-bubble"
import { MessageInput } from "@/components/messages/message-input"
import { UserAvatar } from "@/components/shared/user-avatar"
import { cn } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

interface ChatWindowProps {
  otherUserId: string
  currentUserId: string
  onBack?: () => void
}

// Optimistic message type
interface OptimisticMessage {
  _id: string
  content: string
  createdAt: number
  senderId: string
  receiverId: string
  read: boolean
  replyTo: null
  isOptimistic: true
}

function truncatePartnerId(partnerId: string) {
  if (partnerId.length <= 16) return partnerId
  return `${partnerId.slice(0, 6)}...${partnerId.slice(-4)}`
}

export function ChatWindow({ otherUserId, currentUserId, onBack }: ChatWindowProps) {
  const messages = useQuery(api.messages.getMessages, {
    otherUserId,
    paginationOpts: { numItems: 50, cursor: null },
  })
  const sendMessage = useMutation(api.messages.sendMessage)
  const markAsRead = useMutation(api.messages.markConversationAsRead)

  // Optimistic messages state
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const [replyingTo, setReplyingTo] = useState<{
    id: Id<"messages">
    content: string
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void markAsRead({ otherUserId })
  }, [markAsRead, otherUserId])

  // Remove optimistic messages that are now in the real list
  useEffect(() => {
    if (!messages) return
    setOptimisticMessages((prev) =>
      prev.filter(
        (opt) => !messages.some((m) => m.content === opt.content && m.senderId === currentUserId)
      )
    )
  }, [messages, currentUserId])

  // Auto-scroll on new messages or optimistic messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages?.length, optimisticMessages.length])

  const onSend = async (content: string, replyToId?: Id<"messages">) => {
    // 1. Add optimistic message instantly
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMsg: OptimisticMessage = {
      _id: optimisticId,
      content,
      createdAt: Date.now(),
      senderId: currentUserId,
      receiverId: otherUserId,
      read: false,
      replyTo: null,
      isOptimistic: true,
    }
    setOptimisticMessages((prev) => [...prev, optimisticMsg])

    // 2. Send to server in background
    try {
      await sendMessage({ receiverId: otherUserId, content, replyToId })
      setReplyingTo(null)
    } catch (error) {
      // Remove optimistic message on failure
      setOptimisticMessages((prev) => prev.filter((m) => m._id !== optimisticId))
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    }
  }

  // Merge real + optimistic messages
  const allMessages = [...(messages ?? []), ...optimisticMessages]

  const displayName = truncatePartnerId(otherUserId)

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </button>
        <UserAvatar name={displayName} size="md" />
        <div>
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">Direct message</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted p-4">
        {allMessages.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
        )}
        {allMessages.map((message) => {
          const isSent = message.senderId === currentUserId
          const replyTo = "replyTo" in message ? message.replyTo : null

          return (
            <div key={message._id} className="group relative">
              <MessageBubble
                content={message.content}
                createdAt={message.createdAt}
                isSent={isSent}
                isOptimistic={"isOptimistic" in message}
                replyTo={replyTo}
                currentUserId={currentUserId}
              />
              {"isOptimistic" in message ? null : (
                <button
                  type="button"
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 rounded-full border border-border bg-card p-1 text-muted-foreground shadow-sm transition opacity-100 md:opacity-0 md:group-hover:opacity-100",
                    isSent ? "-right-9" : "-left-9"
                  )}
                  onClick={() => setReplyingTo({ id: message._id, content: message.content })}
                  aria-label="Reply to message"
                >
                  <Reply className="size-3.5" />
                </button>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4">
        <MessageInput
          onSend={onSend}
          isSending={false}
          replyTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  )
}
