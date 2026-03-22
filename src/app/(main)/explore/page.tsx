import { ExploreContent } from "@/components/explore/explore-content"
import { PageTransition } from "@/components/shared/page-transition"

export const metadata = { title: "Explore" }

export default function ExplorePage() {
  return (
    <PageTransition>
      <ExploreContent />
    </PageTransition>
  )
}
