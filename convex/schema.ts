import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  posts: defineTable({
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    authorImage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isEdited: v.optional(v.boolean()),
  })
    .index("by_author", ["authorId"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_content", { searchField: "content" }),

  comments: defineTable({
    content: v.string(),
    postId: v.id("posts"),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    authorImage: v.optional(v.string()),
    parentId: v.optional(v.id("comments")),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentId"])
    .index("by_author", ["authorId"]),

  commentLikes: defineTable({
    commentId: v.id("comments"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_user", ["userId"])
    .index("by_comment_user", ["commentId", "userId"]),

  likes: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.optional(v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("haha"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    )),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_user", ["postId", "userId"]),

  saves: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post_user", ["postId", "userId"]),

  follows: defineTable({
    followerId: v.string(),
    followingId: v.string(),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_pair", ["followerId", "followingId"]),

  messages: defineTable({
    content: v.string(),
    senderId: v.string(),
    receiverId: v.string(),
    read: v.boolean(),
    imageUrl: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_conversation", ["senderId", "receiverId"]),

  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.string(),
    reactionType: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("haha"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    ),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_message_user", ["messageId", "userId"]),

  notifications: defineTable({
    userId: v.string(),
    actorId: v.string(),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("follow"),
      v.literal("mention")
    ),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  users: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  userProfiles: defineTable({
    userId: v.string(),
    bio: v.optional(v.string()),
    username: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    showOnlineStatus: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .searchIndex("search_username", { searchField: "username" }),

  userPresence: defineTable({
    userId: v.string(),
    lastSeen: v.number(),
    isTypingTo: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
})
