import { FeedContent } from "@/components/feed/feed-content"
import { preloadAuthQuery } from "@/lib/auth-server"
import { api } from "../../../../convex/_generated/api"

export const metadata = { title: "Feed | Z-Social" }

export default async function FeedPage() {
  const preloadedPosts = await preloadAuthQuery(api.posts.getFeedPosts, {
    paginationOpts: { numItems: 10, cursor: null },
  })

  return <FeedContent preloadedPosts={preloadedPosts} />
}
