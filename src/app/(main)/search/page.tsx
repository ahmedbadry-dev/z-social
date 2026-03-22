import { SearchContent } from "@/components/search/search-content"
import { PageTransition } from "@/components/shared/page-transition"

export const metadata = { title: "Search | Z-Social" }

export default function SearchPage() {
  return (
    <PageTransition>
      <SearchContent />
    </PageTransition>
  )
}
