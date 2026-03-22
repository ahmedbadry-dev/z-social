"use client"

import { Authenticated } from "convex/react"
import { SavedPostsTab } from "@/components/profile/saved-posts-tab"

export function SavedPostsClient() {
  return (
    <Authenticated>
      <SavedPostsTab />
    </Authenticated>
  )
}
