"use client"
import { ArrowLeft } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { MessageBubble } from "@/components/messages/message-bubble"
import { MessageInput } from "@/components/messages/message-input"
import { OnlineStatus } from "@/components/shared/online-status"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"

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
  const isTyping = useQuery(api.messages.getTypingStatus, { otherUserId })
  const otherPresence = useQuery(api.messages.getPresence, { userId: otherUserId })
  const sendMessage = useMutation(api.messages.sendMessage)
  const markAsRead = useMutation(api.messages.markConversationAsRead)
  const updatePresence = useMutation(api.messages.updatePresence)

  // Optimistic messages state
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      void updatePresence({ isTypingTo: undefined })
    }
  }, [updatePresence])

  const handleTyping = () => {
    void updatePresence({ isTypingTo: otherUserId })
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      void updatePresence({ isTypingTo: undefined })
    }, 2000)
  }

  const onSend = async (content: string) => {
    // 1. Add optimistic message instantly
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMsg: OptimisticMessage = {
      _id: optimisticId,
      content,
      createdAt: Date.now(),
      senderId: currentUserId,
      receiverId: otherUserId,
      read: false,
      isOptimistic: true,
    }
    setOptimisticMessages((prev) => [...prev, optimisticMsg])

    // 2. Send to server in background
    try {
      await sendMessage({ receiverId: otherUserId, content })
    } catch (error) {
      // Remove optimistic message on failure
      setOptimisticMessages((prev) => prev.filter((m) => m._id !== optimisticId))
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    }
  }

  // Merge real + optimistic messages
  const allMessages = [...(messages ?? []), ...optimisticMessages]

  const displayName = truncatePartnerId(otherUserId)
  const isOnline = otherPresence?.isOnline ?? false

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
        <div className="relative">
          <UserAvatar name={displayName} size="md" />
          <OnlineStatus isOnline={isOnline} className="absolute -bottom-0.5 -right-0.5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          <p className={isOnline ? "text-xs text-green-500" : "text-xs text-muted-foreground"}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted p-4">
        {allMessages.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
        )}
        {isTyping && (
          <div className="flex items-center gap-2 px-4 py-1">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-muted-foreground">typing...</span>
          </div>
        )}
        {allMessages.map((message) => {
          const isSent = message.senderId === currentUserId

          return (
            <MessageBubble
              key={message._id}
              content={message.content}
              createdAt={message.createdAt}
              isSent={isSent}
              isOptimistic={"isOptimistic" in message}
            />
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4">
        <MessageInput onSend={onSend} isSending={false} onTyping={handleTyping} />
      </div>
    </div>
  )
}
