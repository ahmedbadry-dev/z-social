"use client"

import type { Doc } from "../../../convex/_generated/dataModel"
import { PostCard } from "@/components/feed/post-card"

interface PostResultCardProps {
  post: Doc<"posts"> & {
    likesCount: number
    commentsCount: number
    isLikedByMe: boolean
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
        authorName: post.authorName ?? post.authorId,
        authorImage: post.authorImage,
        createdAt: post.createdAt,
        isEdited: post.isEdited,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        isLikedByMe: post.isLikedByMe,
        isSavedByMe: post.isSavedByMe,
        isOwnPost: currentUserId === post.authorId,
      }}
    />
  )
}
