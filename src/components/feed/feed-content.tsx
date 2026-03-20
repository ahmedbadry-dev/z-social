"use client"

import { Authenticated, AuthLoading, type Preloaded } from "convex/react"
import { FeedList } from "./feed-list"
import { PostComposer } from "./post-composer"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { api } from "../../../convex/_generated/api"

interface FeedContentProps {
  preloadedPosts?: Preloaded<typeof api.posts.getFeedPosts>
}

export function FeedContent({ preloadedPosts }: FeedContentProps) {
  return (
    <div className="space-y-4">
      <AuthLoading>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </AuthLoading>
      <Authenticated>
        <PostComposer />
        <FeedList preloadedPosts={preloadedPosts} />
      </Authenticated>
    </div>
  )
}
