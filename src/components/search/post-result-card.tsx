"use client"

import type { Doc } from "../../../convex/_generated/dataModel"
import { PostCard } from "@/components/feed/post-card"
import type { ReactionSummary, ReactionType } from "@/types"

interface PostResultCardProps {
  post: Doc<"posts"> & {
    myReaction: ReactionType | null
    reactionsCount: number
    reactionsSummary: ReactionSummary[]
    commentsCount: number
    isSavedByMe: boolean
  }
  currentUserId: string
}

export function PostResultCard({ post, currentUserId }: PostResultCardProps) {
  return (
    <PostCard
      currentUserId={currentUserId}
      post={{
        _id: post._id,
        content: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        authorId: post.authorId,
        authorName: post.authorName ?? "Unknown",
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
    />
  )
}
