"use client"

import { memo, useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { api } from "../../../convex/_generated/api"

interface UserListItemProps {
  userId: string
  name: string | null
  image: string | null
  isFollowedByMe: boolean
  hasRequestedFollow?: boolean
  isCurrentUser?: boolean
  showFollowButton: boolean
}

function getDisplayName(userId: string, name: string | null): string {
  if (name && name.trim()) return name.trim()
  if (userId.length <= 16) return userId
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`
}

export const UserListItem = memo(function UserListItem({
  userId,
  name,
  image,
  isFollowedByMe,
  hasRequestedFollow = false,
  isCurrentUser = false,
  showFollowButton,
}: UserListItemProps) {
  const followUser = useMutation(api.follows.followUser)
  const [optimisticState, setOptimisticState] = useState<
    "following" | "requested" | "none" | null
  >(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const displayName = getDisplayName(userId, name)

  const isFollowing =
    optimisticState === "following"
      ? true
      : optimisticState === "none"
        ? false
        : isFollowedByMe

  const hasRequested =
    optimisticState === "requested"
      ? true
      : optimisticState === "none"
        ? false
        : hasRequestedFollow

  const handleToggle = async (): Promise<void> => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      const result = await followUser({ targetUserId: userId })
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
    } finally {
      setIsUpdating(false)
    }
  }

  const buttonLabel = isFollowing ? "Following" : hasRequested ? "Requested" : "Follow"

  return (
    <div className="flex items-center gap-3 p-4">
      <UserAvatar name={displayName} imageUrl={image ?? undefined} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{userId}</p>
      </div>
      {showFollowButton && !isCurrentUser && (
        <Button
          type="button"
          size="sm"
          variant={isFollowing || hasRequested ? "outline" : "default"}
          className={
            isFollowing || hasRequested
              ? "border-border"
              : "bg-[#3B55E6] text-white hover:bg-[#2D46D6]"
          }
          disabled={isUpdating}
          onClick={() => void handleToggle()}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  )
})
