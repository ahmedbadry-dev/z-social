"use client"

import { useState } from "react"
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
  showFollowButton: boolean
}

function getDisplayName(userId: string, name: string | null): string {
  if (name && name.trim()) return name.trim()
  if (userId.length <= 16) return userId
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`
}

export function UserListItem({
  userId,
  name,
  image,
  isFollowedByMe,
  showFollowButton,
}: UserListItemProps): JSX.Element {
  const toggleFollow = useMutation(api.follows.toggleFollow)
  const [optimisticFollow, setOptimisticFollow] = useState<boolean | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const displayName = getDisplayName(userId, name)
  const isFollowing = optimisticFollow ?? isFollowedByMe

  const handleToggle = async (): Promise<void> => {
    if (isUpdating) return
    const next = !isFollowing
    setOptimisticFollow(next)
    setIsUpdating(true)
    try {
      await toggleFollow({ targetUserId: userId })
      setOptimisticFollow(null)
    } catch (error) {
      setOptimisticFollow(null)
      const message = error instanceof Error ? error.message : "Failed to update follow status"
      toast.error(message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <UserAvatar name={displayName} imageUrl={image ?? undefined} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{userId}</p>
      </div>
      {showFollowButton && (
        <Button
          type="button"
          size="sm"
          variant={isFollowing ? "default" : "outline"}
          className={isFollowing ? "bg-[#0F172A] text-white" : ""}
          disabled={isUpdating}
          onClick={() => void handleToggle()}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  )
}
