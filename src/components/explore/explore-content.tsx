"use client"

import { motion } from "motion/react"
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B55E6]/10">
            <Compass className="size-5 text-[#3B55E6]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Explore</h1>
            <p className="text-xs text-muted-foreground">Discover trending posts</p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Trending posts</h2>

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
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={cn(
              "relative",
              index === 0 && "ring-2 ring-yellow-400/30 rounded-xl",
              index === 1 && "ring-2 ring-slate-400/20 rounded-xl",
              index === 2 && "ring-2 ring-orange-400/20 rounded-xl"
            )}
          >
            {index === 0 && (
              <motion.div
                className="absolute -top-3 -left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg ring-2 ring-yellow-400/50"
                animate={{
                  y: [0, -4, 0],
                  boxShadow: [
                    "0 0 0 0 rgba(251,191,36,0.4)",
                    "0 0 0 8px rgba(251,191,36,0)",
                    "0 0 0 0 rgba(251,191,36,0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span className="text-xs font-bold text-amber-700">#1</span>
              </motion.div>
            )}

            {index === 1 && (
              <motion.div
                className="absolute -top-3 -left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-lg ring-2 ring-slate-400/50"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xs font-bold text-slate-600">#2</span>
              </motion.div>
            )}

            {index === 2 && (
              <motion.div
                className="absolute -top-3 -left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-600 shadow-lg ring-2 ring-orange-400/50"
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xs font-bold text-orange-700">#3</span>
              </motion.div>
            )}

            {index >= 3 && index < 5 ? (
              <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
            ) : null}
            {index < 3 ? (
              <div className="pt-4">
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
            ) : (
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
            )}
          </motion.div>
        ))}
      </section>
    </div>
  )
}
