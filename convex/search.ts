import { v } from "convex/values"
import { query } from "./_generated/server"

export const searchPosts = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    if (args.q.trim().length < 2) {
      return []
    }

    return ctx.db
      .query("posts")
      .withSearchIndex("search_content", (q) => q.search("content", args.q.trim()))
      .take(10)
  },
})
