import type { Id } from "../../convex/_generated/dataModel"

export interface CurrentUser {
  _id: string
  name: string
  email: string
  image?: string | null
}

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

export interface ReactionSummary {
  type: ReactionType
  count: number
}

export interface PostCardData {
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
  reactionsSummary: ReactionSummary[]
  commentsCount: number
  isSavedByMe: boolean
  isOwnPost: boolean
}

export interface CommentData {
  _id: Id<"comments">
  content: string
  authorId: string
  authorName: string
  authorImage?: string
  postId: Id<"posts">
  parentId?: Id<"comments">
  createdAt: number
}

export type NotificationType = "like" | "comment" | "reply" | "follow" | "mention"

export interface NotificationData {
  _id: Id<"notifications">
  type: NotificationType
  actorId: string
  userId: string
  postId?: Id<"posts">
  read: boolean
  createdAt: number
}

export interface ConversationData {
  partnerId: string
  lastMessage: string
  lastMessageTime: number
  isLastMessageMine: boolean
  hasUnread: boolean
}

export interface MessageData {
  _id: Id<"messages">
  content: string
  senderId: string
  receiverId: string
  read: boolean
  createdAt: number
}

export interface UserProfileData {
  userId: string
  bio?: string | null
  username?: string | null
  coverImageUrl?: string | null
  postsCount: number
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isOwnProfile: boolean
}
