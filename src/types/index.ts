import type { Id } from "../../convex/_generated/dataModel"

export interface User {
  _id: string
  name: string
  username: string
  email: string
  bio?: string
  avatarUrl?: string
  coverImageUrl?: string
  createdAt: number
}

export interface Post {
  _id: Id<"posts">
  content: string
  mediaUrl?: string
  mediaType?: "image" | "video"
  authorId: string
  createdAt: number
  updatedAt?: number
  isEdited?: boolean
}

export interface PostWithMeta extends Post {
  author: User
  likesCount: number
  commentsCount: number
  isLikedByMe: boolean
  isSavedByMe: boolean
}

export interface UserProfile extends User {
  postsCount: number
  followersCount: number
  followingCount: number
  isFollowedByMe?: boolean
}
