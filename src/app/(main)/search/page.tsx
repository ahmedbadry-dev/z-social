import { SearchContent } from "@/components/search/search-content"
import { PageTransition } from "@/components/shared/page-transition"

export const metadata = { title: "Search" }

export default function SearchPage() {
  return (
    <PageTransition>
      <SearchContent />
    </PageTransition>
  )
}
