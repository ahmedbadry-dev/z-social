"use client"

import { Authenticated, AuthLoading } from "convex/react"
import { SearchMain } from "@/components/search/search-main"
import { SearchSkeleton } from "@/components/search/search-skeleton"

export function SearchContent() {
  return (
    <div className="space-y-4">
      <AuthLoading>
        <SearchSkeleton />
      </AuthLoading>
      <Authenticated>
        <SearchMain />
      </Authenticated>
    </div>
  )
}
