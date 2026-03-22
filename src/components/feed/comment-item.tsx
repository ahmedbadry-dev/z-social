"use client"

import { ChevronDown, ChevronUp, Heart, SendHorizontal } from "lucide-react"
import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import Link from "next/link"
import { toast } from "sonner"
import type { Id } from "../../../convex/_generated/dataModel"
import { MentionText } from "@/components/shared/mention-text"
import { MentionTextarea } from "@/components/shared/mention-textarea"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"
import { cn, formatRelativeTime } from "@/lib/utils"

interface CommentItemProps {
  comment: {
    _id: Id<"comments">
    content: string
    authorId: string
    authorName?: string | null
    authorImage?: string | null
    createdAt: number
    parentId?: Id<"comments">
  }
  postId: Id<"posts">
  postAuthorId: string
  currentUserId: string
  isReply?: boolean
  rootCommentId?: Id<"comments">
}

export function CommentItem({
  comment,
  postId,
  postAuthorId,
  currentUserId,
  isReply = false,
  rootCommentId,
}: CommentItemProps) {
  const addComment = useMutation(api.comments.addComment)
  const toggleLike = useMutation(api.comments.toggleCommentLike)
  const likes = useQuery(api.comments.getCommentLikes, { commentId: comment._id })
  const replies = useQuery(
    api.comments.getRepliesByComment,
    isReply ? "skip" : { commentId: comment._id }
  )

  const [replyText, setReplyText] = useState("")
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [hasAutoShown, setHasAutoShown] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [optimisticLiked, setOptimisticLiked] = useState(false)
  const [optimisticCount, setOptimisticCount] = useState(0)

  const isLikedByMe = likes?.isLikedByMe ?? optimisticLiked
  const likesCount = likes?.count ?? optimisticCount

  const authorName = comment.authorName ?? `${comment.authorId.slice(0, 8)}...`
  const isAuthor = comment.authorId === postAuthorId
  const repliesCount = replies?.length ?? 0

  useEffect(() => {
    if (isReply || hasAutoShown || !replies || replies.length === 0) return
    if (replies.some((reply) => reply.authorId === currentUserId)) {
      setShowReplies(true)
      setHasAutoShown(true)
    }
  }, [currentUserId, hasAutoShown, isReply, replies])

  const handleLike = async () => {
    const newLiked = !isLikedByMe
    setOptimisticLiked(newLiked)
    setOptimisticCount((prev) => (newLiked ? prev + 1 : prev - 1))
    try {
      await toggleLike({ commentId: comment._id })
    } catch {
      setOptimisticLiked(!newLiked)
      setOptimisticCount((prev) => (newLiked ? prev - 1 : prev + 1))
      toast.error("Failed to like comment")
    }
  }

  const handleReply = async () => {
    const content = replyText.trim()
    if (!content) return

    setIsReplying(true)
    try {
      await addComment({ postId, content, parentId: rootCommentId ?? comment._id })
      setReplyText("")
      setShowReplyInput(false)
      setShowReplies(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply")
    } finally {
      setIsReplying(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2.5">
        <UserAvatar
          name={authorName}
          imageUrl={comment.authorImage ?? undefined}
          size={isReply ? "sm" : "md"}
          className="shrink-0 mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={`/profile?userId=${comment.authorId}`}>
                  <span className="text-[13px] font-semibold text-foreground hover:underline">
                    {authorName}
                  </span>
                </Link>
                {isAuthor && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-[#3B55E6]">
                    Author
                  </span>
                )}
              </div>
              <MentionText
                content={comment.content}
                className="mt-0.5 text-sm text-foreground leading-relaxed"
              />
              <div className="mt-1.5 flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                <button
                  type="button"
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setShowReplyInput((prev) => !prev)}
                >
                  Reply
                </button>
              </div>
            </div>

            <button
              type="button"
              className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5"
              onClick={() => void handleLike()}
            >
              <Heart
                className={cn(
                  "size-3.5 transition-colors",
                  isLikedByMe ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )}
              />
              {likesCount > 0 && (
                <span className="text-[10px] text-muted-foreground">{likesCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showReplyInput && (
        <div className={cn("flex gap-2 items-end", isReply ? "ml-8" : "ml-10")}>
          <UserAvatar name={currentUserId} size="sm" className="shrink-0 mb-1" />
          <div className="flex-1 relative">
            <MentionTextarea
              value={replyText}
              placeholder="Write a reply..."
              rows={1}
              dir="auto"
              className="w-full rounded-2xl border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-[#3B55E6] max-h-24 min-h-9"
              onChange={setReplyText}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void handleReply()
                }
              }}
            />
          </div>
          <button
            type="button"
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3B55E6] text-white disabled:opacity-50"
            disabled={isReplying || !replyText.trim()}
            onClick={() => void handleReply()}
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      )}

      {!isReply && repliesCount > 0 && (
        <button
          type="button"
          className="ml-10 flex items-center gap-1.5 text-[12px] font-semibold text-[#3B55E6]"
          onClick={() => setShowReplies((prev) => !prev)}
        >
          <span className="h-px w-6 bg-border" />
          {showReplies ? (
            <>
              <ChevronUp className="size-3.5" />
              Hide replies
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              View {repliesCount} {repliesCount === 1 ? "reply" : "replies"}
            </>
          )}
        </button>
      )}

      {!isReply && showReplies && replies && replies.length > 0 && (
        <div className="ml-10 space-y-3 border-l-2 border-border pl-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              isReply
              rootCommentId={comment._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
