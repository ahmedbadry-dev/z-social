"use client"

import { useQuery } from "convex/react"
import { Compass } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { PostCard } from "@/components/feed/post-card"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import type { ReactionType } from "@/types"
import { cn } from "@/lib/utils"

export function ExploreContent() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const trendingPosts = useQuery(api.posts.getTrendingPosts)

  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")
  const rankConfig = [
    {
      emoji: "👑",
      gradient: "from-yellow-400 to-amber-500",
      textColor: "text-yellow-900",
      ring: "ring-yellow-400/50",
    },
    {
      emoji: "🥈",
      gradient: "from-slate-300 to-slate-400",
      textColor: "text-slate-800",
      ring: "ring-slate-400/50",
    },
    {
      emoji: "🥉",
      gradient: "from-orange-400 to-amber-600",
      textColor: "text-orange-900",
      ring: "ring-orange-400/50",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Compass className="size-5 text-[#3B55E6]" />
        <h1 className="text-lg font-semibold text-foreground">Explore</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          {trendingPosts && trendingPosts.length > 0 ? "🔥 Trending posts" : "Trending posts"}
        </h2>

        {trendingPosts === undefined && (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        {trendingPosts?.length === 0 && (
          <EmptyState
            icon={Compass}
            title="Nothing trending yet"
            description="Be the first to post something!"
          />
        )}

        {trendingPosts?.map((post, index) => (
          <div
            key={post._id}
            className={cn(
              "relative",
              index === 0 && "ring-2 ring-yellow-400/30 rounded-lg",
              index === 1 && "ring-2 ring-slate-400/30 rounded-lg",
              index === 2 && "ring-2 ring-orange-400/30 rounded-lg"
            )}
          >
            {index < 3 ? (
              <div
                className={cn(
                  "absolute -top-3 -left-3 z-10",
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  "bg-gradient-to-br shadow-lg ring-2",
                  rankConfig[index].gradient,
                  rankConfig[index].ring
                )}
              >
                <span className="text-lg">{rankConfig[index].emoji}</span>
              </div>
            ) : index < 5 ? (
              <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
            ) : null}
            <PostCard
              currentUserId={currentUserId}
              post={{
                _id: post._id,
                content: post.content,
                mediaUrl: post.mediaUrl,
                mediaType: post.mediaType,
                authorId: post.authorId,
                authorName: post.authorName ?? "Unknown",
                authorImage: post.authorImage,
                createdAt: post.createdAt,
                isEdited: post.isEdited,
                myReaction: post.myReaction,
                reactionsCount: post.reactionsCount,
                reactionsSummary: post.reactionsSummary.map((r) => ({
                  ...r,
                  type: r.type as ReactionType,
                })),
                commentsCount: post.commentsCount,
                isSavedByMe: post.isSavedByMe,
                isOwnPost: currentUserId === post.authorId,
              }}
            />
          </div>
        ))}
      </section>
    </div>
  )
}
