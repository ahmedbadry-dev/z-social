"use client"

import { Authenticated, AuthLoading } from "convex/react"
import { FeedList } from "./feed-list"
import { PostComposer } from "./post-composer"
import { PostSkeleton } from "@/components/shared/post-skeleton"

export function FeedContent() {
    return (
        <div className="space-y-4">
            <AuthLoading>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </AuthLoading>
            <Authenticated>
                <PostComposer />
                <FeedList />
            </Authenticated>
        </div>
    )
}