"use client"

import { ArrowLeft } from "lucide-react"
import { FileX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { PostCard } from "@/components/feed/post-card"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { EmptyState } from "@/components/shared/empty-state"

interface PostDetailClientProps {
  postId: string
}

export function PostDetailClient({ postId }: PostDetailClientProps) {
  const router = useRouter()
  const currentUser = useQuery(api.auth.getCurrentUser)
  const post = useQuery(api.posts.getPostById, {
    postId: postId as Id<"posts">,
  })

  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")

  return (
    <div className="mx-auto max-w-[640px] space-y-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {post === undefined && <PostSkeleton />}

      {post === null && (
        <EmptyState
          icon={FileX}
          title="Post not found"
          description="This post may have been deleted or doesn't exist."
        />
      )}

      {post && (
        <PostCard
          post={{
            _id: post._id,
            content: post.content,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            authorId: post.authorId,
            authorName: post.authorName ?? post.authorId,
            authorImage: post.authorImage,
            createdAt: post.createdAt,
            isEdited: post.isEdited,
            myReaction: post.myReaction,
            reactionsCount: post.reactionsCount,
            reactionsSummary: post.reactionsSummary,
            commentsCount: post.commentsCount,
            isSavedByMe: post.isSavedByMe,
            isOwnPost: currentUserId === post.authorId,
          }}
          currentUserId={currentUserId}
          defaultShowComments={true}
        />
      )}
    </div>
  )
}
