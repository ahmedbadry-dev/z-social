"use client"

import Image from "next/image"
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Edit3,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { memo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import type { Id } from "../../../convex/_generated/dataModel"
import { CommentItem } from "@/components/feed/comment-item"
import { PostActions } from "@/components/feed/post-actions"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "../../../convex/_generated/api"
import { formatRelativeTime } from "@/lib/utils"
import type { ReactionType } from "@/types"
import dynamic from "next/dynamic"

const EditPostDialog = dynamic(
  () => import("@/components/feed/edit-post-dialog").then((m) => ({ default: m.EditPostDialog })),
  { ssr: false }
)

const ConfirmDialog = dynamic(
  () => import("@/components/shared/confirm-dialog").then((m) => ({ default: m.ConfirmDialog })),
  { ssr: false }
)

interface PostCardProps {
  post: {
    _id: Id<"posts">
    content: string
    mediaUrl?: string
    mediaType?: "image" | "video"
    authorId: string
    authorName: string
    authorImage?: string
    createdAt: number
    isEdited?: boolean
    myReaction: ReactionType | null
    reactionsCount: number
    reactionsSummary: Array<{ type: string; count: number }>
    commentsCount: number
    isSavedByMe: boolean
    isOwnPost: boolean
  }
  currentUserId: string
}

export const PostCard = memo(function PostCard({ post, currentUserId }: PostCardProps) {
  const comments = useQuery(api.comments.getCommentsByPost, { postId: post._id })
  const addComment = useMutation(api.comments.addComment)
  const toggleSaveMutation = useMutation(api.posts.toggleSave)
  const updatePostMutation = useMutation(api.posts.updatePost)
  const deletePostMutation = useMutation(api.posts.deletePost)

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [saved, setSaved] = useState(post.isSavedByMe)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSaveToggle = async () => {
    const next = !saved
    setSaved(next)
    try {
      await toggleSaveMutation({ postId: post._id })
    } catch {
      setSaved(!next)
      toast.error("Failed to update saved state")
    }
  }

  const handleCommentSubmit = async () => {
    const content = commentText.trim()
    if (!content) {
      return
    }
    try {
      await addComment({ postId: post._id, content })
      setCommentText("")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add comment"
      toast.error(message)
    }
  }

  const handleSaveEdit = async (content: string) => {
    setIsUpdating(true)
    try {
      await updatePostMutation({ postId: post._id, content })
      setEditOpen(false)
      toast.success("Post updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update post"
      toast.error(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeletePost = async () => {
    setIsDeleting(true)
    try {
      await deletePostMutation({ postId: post._id })
      setDeleteOpen(false)
      toast.success("Post deleted")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete post"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article className="rounded-lg bg-card p-4 shadow-sm">
      <header className="flex items-start gap-3">
        <UserAvatar name={post.authorName} imageUrl={post.authorImage} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{post.authorName}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {post.isOwnPost ? (
              <>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Edit3 className="size-4" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  Delete Post
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => void handleSaveToggle()}>
                {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {saved ? "Unsave Post" : "Save Post"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="mt-3 space-y-2">
        <p dir="auto" className="whitespace-pre-wrap text-sm text-foreground">{post.content}</p>
        {post.isEdited && <p className="text-xs text-muted-foreground">(edited)</p>}
      </div>

      {post.mediaUrl && post.mediaType === "image" && (
        <div className="relative mt-3 overflow-hidden rounded-lg">
          <Image
            src={post.mediaUrl}
            alt="Post media"
            width={900}
            height={500}
            loading="lazy"
            className="max-h-[400px] w-full object-cover"
          />
        </div>
      )}

      {post.mediaUrl && post.mediaType === "video" && (
        <video
          src={post.mediaUrl}
          controls
          className="mt-3 max-h-[400px] w-full rounded-lg object-cover"
        />
      )}

      <div className="mt-3">
        <PostActions
          postId={post._id}
          myReaction={post.myReaction}
          reactionsCount={post.reactionsCount}
          reactionsSummary={post.reactionsSummary}
          commentsCount={post.commentsCount}
          onCommentToggle={() => setShowComments((prev) => !prev)}
          onReactionChange={(_type, _countDelta) => {}}
        />
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 rounded-lg bg-muted p-3">
          <div className="flex items-center gap-2">
            <UserAvatar name={currentUserId} size="sm" />
            <input
              value={commentText}
              placeholder="Write a comment..."
              className="h-9 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-[#3B55E6]"
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void handleCommentSubmit()
                }
              }}
            />
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
              onClick={() => void handleCommentSubmit()}
            >
              <Check className="size-4" />
            </button>
          </div>

          <div className="space-y-3">
            {comments?.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={{ ...comment, authorName: comment.authorId }}
                postId={post._id}
                postAuthorId={post.authorId}
                currentUserId={currentUserId}
              />
            ))}
            {comments && comments.length === 0 && (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            )}
          </div>
        </div>
      )}

      {editOpen && (
        <EditPostDialog
          post={{ _id: post._id, content: post.content }}
          open={editOpen}
          isSaving={isUpdating}
          onOpenChange={setEditOpen}
          onSave={handleSaveEdit}
        />
      )}
      {deleteOpen && (
        <ConfirmDialog
          open={deleteOpen}
          title="Delete post"
          description="This action cannot be undone."
          confirmLabel="Delete"
          confirmVariant="destructive"
          isLoading={isDeleting}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDeletePost}
        />
      )}
    </article>
  )
})
