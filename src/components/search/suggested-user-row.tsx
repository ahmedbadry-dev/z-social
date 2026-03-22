"use client"

import { Check, Plus } from "lucide-react"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"

interface SuggestedUserRowProps {
  user: {
    userId: string
    name?: string | null
    image?: string | null
  }
}

function getDisplayName(userId: string, name?: string | null) {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  if (userId.length <= 16) return userId
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`
}

export function SuggestedUserRow({ user }: SuggestedUserRowProps) {
  const followUser = useMutation(api.follows.followUser)
  const followStatus = useQuery(api.follows.getFollowStatus, { targetUserId: user.userId })
  const [optimisticState, setOptimisticState] = useState<
    "following" | "requested" | "none" | null
  >(null)
  const displayName = getDisplayName(user.userId, user.name)

  const isLoading = followStatus === undefined

  const isFollowing =
    optimisticState === "following"
      ? true
      : optimisticState === "none"
        ? false
        : followStatus?.isFollowing ?? false

  const hasRequested =
    optimisticState === "requested"
      ? true
      : optimisticState === "none"
        ? false
        : followStatus?.hasRequestedFollow ?? false

  const onToggleFollow = async () => {
    try {
      const result = await followUser({ targetUserId: user.userId })
      if (result.action === "followed") {
        setOptimisticState("following")
      } else if (result.action === "unfollowed") {
        setOptimisticState("none")
      } else if (result.action === "request_sent") {
        setOptimisticState("requested")
      } else if (result.action === "request_cancelled") {
        setOptimisticState("none")
      }
    } catch (error) {
      setOptimisticState(null)
      const message = error instanceof Error ? error.message : "Failed to update follow status"
      toast.error(message)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-sm">
      <UserAvatar name={displayName} imageUrl={user.image ?? undefined} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">Suggested for you</p>
      </div>
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={
          isFollowing
            ? "Unfollow user"
            : hasRequested
              ? "Cancel follow request"
              : "Follow user"
        }
        disabled={isLoading}
        onClick={() => void onToggleFollow()}
      >
        {isFollowing ? (
          <Check className="size-4 text-green-600" />
        ) : hasRequested ? (
          <Check className="size-4 text-muted-foreground" />
        ) : (
          <Plus className="size-4" />
        )}
      </button>
    </div>
  )
}
