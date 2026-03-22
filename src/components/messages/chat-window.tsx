"use client"
import { ArrowLeft } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import Link from "next/link"
import { toast } from "sonner"
import { MessageBubble } from "@/components/messages/message-bubble"
import { MessageInput } from "@/components/messages/message-input"
import { OnlineStatus } from "@/components/shared/online-status"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"
import { useUploadThing } from "@/lib/uploadthing"
import { formatLastSeen, formatDateSeparator, isDifferentDay } from "@/lib/utils"

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
  imageUrl?: string
  remoteUrl?: string
  isUploading?: boolean
  uploadFailed?: boolean
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
  const otherUser = useQuery(api.users.getUserById, { userId: otherUserId })
  const sendMessage = useMutation(api.messages.sendMessage)
  const markAsRead = useMutation(api.messages.markConversationAsRead)
  const updatePresence = useMutation(api.messages.updatePresence)
  const { startUpload } = useUploadThing("chatImage")

  // Optimistic messages state
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canceledUploadsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    void markAsRead({ otherUserId })
  }, [markAsRead, otherUserId])

  // Remove optimistic messages that are now in the real list
  useEffect(() => {
    if (!messages) return
    setOptimisticMessages((prev) =>
      prev.filter((opt) => {
        if (opt.imageUrl || opt.remoteUrl) {
          return !messages.some(
            (m) =>
              "imageUrl" in m &&
              (m.imageUrl === opt.remoteUrl || m.imageUrl === opt.imageUrl) &&
              m.senderId === currentUserId
          )
        }
        return !messages.some((m) => m.content === opt.content && m.senderId === currentUserId)
      })
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

  const onSend = async (content: string, imageFile?: File, localPreviewUrl?: string) => {
    const optimisticId = `optimistic-${Date.now()}`

    const optimisticMsg: OptimisticMessage = {
      _id: optimisticId,
      content,
      createdAt: Date.now(),
      senderId: currentUserId,
      receiverId: otherUserId,
      read: false,
      imageUrl: localPreviewUrl,
      isUploading: !!imageFile,
      uploadFailed: false,
      isOptimistic: true,
    }
    setOptimisticMessages((prev) => [...prev, optimisticMsg])

    try {
      let uploadedImageUrl: string | undefined
      if (imageFile) {
        const result = await startUpload([imageFile])
        uploadedImageUrl =
          result?.[0]?.serverData?.url ?? result?.[0]?.url ?? result?.[0]?.ufsUrl

        if (canceledUploadsRef.current.has(optimisticId)) {
          canceledUploadsRef.current.delete(optimisticId)
          return
        }

        setOptimisticMessages((prev) =>
          prev.map((message) =>
            message._id === optimisticId
              ? {
                  ...message,
                  isUploading: false,
                  remoteUrl: uploadedImageUrl,
                  imageUrl: uploadedImageUrl ?? message.imageUrl,
                }
              : message
          )
        )
      }

      if (canceledUploadsRef.current.has(optimisticId)) {
        canceledUploadsRef.current.delete(optimisticId)
        return
      }

      await sendMessage({
        receiverId: otherUserId,
        content,
        imageUrl: uploadedImageUrl,
      })
    } catch {
      setOptimisticMessages((prev) =>
        prev.map((message) =>
          message._id === optimisticId
            ? { ...message, isUploading: false, uploadFailed: true }
            : message
        )
      )
    }
  }

  const handleCancelMessage = (optimisticId: string) => {
    canceledUploadsRef.current.add(optimisticId)
    setOptimisticMessages((prev) => prev.filter((message) => message._id !== optimisticId))
  }

  const handleRetryMessage = async (failedMsg: OptimisticMessage) => {
    setOptimisticMessages((prev) => prev.filter((message) => message._id !== failedMsg._id))
    if (failedMsg.remoteUrl) {
      const optimisticId = `optimistic-${Date.now()}`
      const retryMsg: OptimisticMessage = {
        _id: optimisticId,
        content: failedMsg.content,
        createdAt: Date.now(),
        senderId: currentUserId,
        receiverId: otherUserId,
        read: false,
        imageUrl: failedMsg.remoteUrl,
        remoteUrl: failedMsg.remoteUrl,
        isUploading: false,
        uploadFailed: false,
        isOptimistic: true,
      }
      setOptimisticMessages((prev) => [...prev, retryMsg])
      try {
        await sendMessage({
          receiverId: otherUserId,
          content: failedMsg.content,
          imageUrl: failedMsg.remoteUrl,
        })
        setOptimisticMessages((prev) => prev.filter((m) => m._id !== optimisticId))
      } catch {
        setOptimisticMessages((prev) =>
          prev.map((m) => (m._id === optimisticId ? { ...m, uploadFailed: true } : m))
        )
      }
    } else {
      await onSend(failedMsg.content)
    }
  }

  // Merge real + optimistic messages
  const allMessages = [...(messages ?? []), ...optimisticMessages]

  const displayName = otherUser?.name?.trim() || truncatePartnerId(otherUserId)
  const otherUserImage = otherUser?.image ?? undefined
  const isOnline = otherPresence?.isOnline ?? false
  const isStatusHidden = otherPresence?.isHidden ?? false
  const lastSeen = otherPresence?.lastSeen ?? null

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </button>
        <Link
          href={`/profile?userId=${otherUserId}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <UserAvatar name={displayName} imageUrl={otherUserImage} size="md" />
            {!isStatusHidden && (
              <OnlineStatus
                isOnline={isOnline}
                className="absolute -bottom-0.5 -right-0.5"
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            {!isStatusHidden && (
              <p className={isOnline ? "text-xs text-[#22C55E]" : "text-xs text-muted-foreground"}>
                {isOnline ? "Online" : formatLastSeen(lastSeen)}
              </p>
            )}
          </div>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto bg-muted/50 p-4">
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
        {(() => {
          const lastSentIndex = allMessages.reduce((acc, msg, i) => {
            return msg.senderId === currentUserId ? i : acc
          }, -1)

          return allMessages.map((message, index) => {
            const isSent = message.senderId === currentUserId
            const prevMessage = index > 0 ? allMessages[index - 1] : null
            const nextMessage = index < allMessages.length - 1 ? allMessages[index + 1] : null

            const TWO_MIN = 2 * 60 * 1000
            const isFirstInGroup =
              !prevMessage ||
              prevMessage.senderId !== message.senderId ||
              message.createdAt - prevMessage.createdAt > TWO_MIN

            const isLastInGroup =
              !nextMessage ||
              nextMessage.senderId !== message.senderId ||
              nextMessage.createdAt - message.createdAt > TWO_MIN

            const showDateSeparator =
              !prevMessage || isDifferentDay(prevMessage.createdAt, message.createdAt)

            const showReadReceipt = isSent && index === lastSentIndex
            const isRead = "read" in message ? message.read : false

            return (
              <div key={message._id}>
                {showDateSeparator && (
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="px-2 text-[11px] font-medium text-muted-foreground">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <MessageBubble
                  content={message.content}
                  createdAt={message.createdAt}
                  isSent={isSent}
                  isRead={isRead}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  showReadReceipt={showReadReceipt}
                  isOptimistic={"isOptimistic" in message}
                  imageUrl={"imageUrl" in message ? message.imageUrl : null}
                  isUploading={"isUploading" in message ? message.isUploading : false}
                  uploadFailed={"uploadFailed" in message ? message.uploadFailed : false}
                  onCancel={
                    "isOptimistic" in message && message.isUploading
                      ? () => handleCancelMessage(message._id)
                      : undefined
                  }
                  onRetry={
                    "isOptimistic" in message && message.uploadFailed
                      ? () => void handleRetryMessage(message)
                      : undefined
                  }
                />
              </div>
            )
          })
        })()}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <MessageInput onSend={onSend} isSending={false} onTyping={handleTyping} />
      </div>
    </div>
  )
}
