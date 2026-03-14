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
    parentId: v.optional(v.id("comments")),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentId"])
    .index("by_author", ["authorId"]),

  likes: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
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
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_conversation", ["senderId", "receiverId"]),

  notifications: defineTable({
    userId: v.string(),
    actorId: v.string(),
    type: v.union(v.literal("like"), v.literal("comment"), v.literal("reply"), v.literal("follow")),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),
})
