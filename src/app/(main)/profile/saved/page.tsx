"use client"

import { Authenticated } from "convex/react"
import { SavedPostsTab } from "@/components/profile/saved-posts-tab"

export default function SavedPostsPage() {
  return (
    <Authenticated>
      <SavedPostsTab />
    </Authenticated>
  )
}
