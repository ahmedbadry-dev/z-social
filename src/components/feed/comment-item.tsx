"use client"

import { SendHorizontal } from "lucide-react"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import type { Id } from "../../../convex/_generated/dataModel"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"
import { formatRelativeTime } from "@/lib/utils"

interface CommentItemProps {
  comment: {
    _id: Id<"comments">
    content: string
    authorId: string
    authorName?: string
    authorImage?: string
    createdAt: number
    parentId?: Id<"comments">
  }
  postId: Id<"posts">
  postAuthorId: string
  currentUserId: string
  isReply?: boolean
}

export function CommentItem({
  comment,
  postId,
  postAuthorId,
  currentUserId,
  isReply = false,
}: CommentItemProps) {
  const addComment = useMutation(api.comments.addComment)
  const replies = useQuery(
    api.comments.getRepliesByComment,
    isReply ? "skip" : { commentId: comment._id }
  )
  const [replyText, setReplyText] = useState("")
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [isReplying, setIsReplying] = useState(false)

  const authorName = comment.authorName ?? comment.authorId
  const isAuthor = comment.authorId === postAuthorId

  const handleReply = async () => {
    const content = replyText.trim()
    if (!content) {
      return
    }

    setIsReplying(true)
    try {
      await addComment({
        postId,
        content,
        parentId: comment._id,
      })
      setReplyText("")
      setShowReplyInput(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reply"
      toast.error(message)
    } finally {
      setIsReplying(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <UserAvatar
          name={authorName}
          imageUrl={comment.authorImage}
          size={isReply ? "sm" : "md"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13px] font-semibold text-foreground">{authorName}</p>
            {isAuthor && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-[#3B55E6]">
                Author
              </span>
            )}
            <p className="ml-auto text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</p>
          </div>
          <p dir="auto" className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {comment.content}
          </p>
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowReplyInput((prev) => !prev)}
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {showReplyInput && (
        <div className="ml-8 flex items-center gap-2">
          <UserAvatar name={currentUserId} size="sm" />
          <input
            value={replyText}
            placeholder="Write a reply..."
            className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-[#3B55E6]"
            onChange={(event) => setReplyText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void handleReply()
              }
            }}
          />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
            disabled={isReplying}
            onClick={() => void handleReply()}
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      )}

      {!isReply && replies && replies.length > 0 && (
        <div className="ml-8 space-y-3 border-l-2 border-border pl-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={{ ...reply, authorName: reply.authorId }}
              postId={postId}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
}
