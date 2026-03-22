"use client"

import { motion } from "motion/react"
import { MessageCircle, Share2 } from "lucide-react"
import { toast } from "sonner"
import type { Id } from "../../../convex/_generated/dataModel"
import { ReactionBar } from "@/components/feed/reaction-bar"
import type { ReactionType } from "@/types"

const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
}

interface PostActionsProps {
  postId: Id<"posts">
  myReaction: ReactionType | null
  reactionsCount: number
  reactionsSummary: Array<{ type: string; count: number }>
  commentsCount: number
  onCommentToggle: () => void
  onReactionChange: (type: ReactionType | null, countDelta: number) => void
}

export function PostActions({
  postId,
  myReaction,
  reactionsCount,
  reactionsSummary,
  commentsCount,
  onCommentToggle,
}: PostActionsProps) {
  const handleShare = async (): Promise<void> => {
    const url = `${window.location.origin}/post/${postId}`
    await navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  return (
    <div className="space-y-2">
      {(reactionsCount > 0 || commentsCount > 0) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {reactionsCount > 0 && (
              <>
                <div className="flex -space-x-2">
                  {reactionsSummary.slice(0, 3).map((summary) => (
                    <span
                      key={summary.type}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-sm"
                    >
                      {REACTION_EMOJI_MAP[summary.type as ReactionType] ?? "👍"}
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium text-foreground">{reactionsCount}</span>
              </>
            )}
          </div>
          {commentsCount > 0 && <span>{commentsCount} comments</span>}
        </div>
      )}

      <div className="h-px w-full bg-border" />

      <div className="flex items-center justify-between pt-3">
        <ReactionBar
          postId={postId}
          myReaction={myReaction}
          reactionsCount={reactionsCount}
          reactionsSummary={[]}
        />

        <motion.button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={onCommentToggle}
        >
          <MessageCircle className="size-4" />
          <span>Comment</span>
        </motion.button>

        <motion.button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => void handleShare()}
        >
          <Share2 className="size-4" />
          <span>Share</span>
        </motion.button>
      </div>
    </div>
  )
}
