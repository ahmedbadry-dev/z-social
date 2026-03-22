import { FeedContent } from "@/components/feed/feed-content"
import { PageTransition } from "@/components/shared/page-transition"
import { preloadAuthQuery } from "@/lib/auth-server"
import { api } from "../../../../convex/_generated/api"

export const metadata = { title: "Feed" }

export default async function FeedPage() {
  const preloadedPosts = await preloadAuthQuery(api.posts.getFeedPosts, {
    paginationOpts: { numItems: 10, cursor: null },
  })

  return (
    <PageTransition>
      <FeedContent preloadedPosts={preloadedPosts} />
    </PageTransition>
  )
}
