"use client"

import { Check, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
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
  const toggleFollow = useMutation(api.follows.toggleFollow)
  const followStatus = useQuery(api.follows.getFollowStatus, { targetUserId: user.userId })
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null)
  const displayName = getDisplayName(user.userId, user.name)

  useEffect(() => {
    if (followStatus !== undefined) {
      setOptimisticFollowing(followStatus.isFollowing)
    }
  }, [followStatus])

  const isFollowing = optimisticFollowing ?? false
  const isLoading = followStatus === undefined

  const onToggleFollow = async () => {
    const next = !isFollowing
    setOptimisticFollowing(next)
    try {
      const result = await toggleFollow({ targetUserId: user.userId })
      setOptimisticFollowing(result.following)
    } catch {
      setOptimisticFollowing(!next)
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
        className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={isFollowing ? "Unfollow user" : "Follow user"}
        disabled={isLoading}
        onClick={() => void onToggleFollow()}
      >
        {isFollowing ? <Check className="size-4 text-green-600" /> : <Plus className="size-4" />}
      </button>
    </div>
  )
}
