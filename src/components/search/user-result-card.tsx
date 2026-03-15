"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { api } from "../../../convex/_generated/api"

interface UserResultCardProps {
  userId: string
  username?: string
  bio?: string
  isCurrentUser: boolean
}

export function UserResultCard({ userId, username, bio, isCurrentUser }: UserResultCardProps) {
  const router = useRouter()
  const toggleFollow = useMutation(api.follows.toggleFollow)
  const followStatus = useQuery(api.follows.getFollowStatus, { targetUserId: userId })
  const [isUpdating, setIsUpdating] = useState(false)

  const displayName = username?.trim() || userId
  const displayBio = bio?.trim() || "No bio available"
  const isFollowing = followStatus?.isFollowing ?? false

  const onToggleFollow = async () => {
    setIsUpdating(true)
    try {
      await toggleFollow({ targetUserId: userId })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update follow status"
      toast.error(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const onOpenProfile = () => {
    if (isCurrentUser) {
      router.push("/profile")
    } else {
      router.push(`/messages?userId=${userId}`)
    }
  }

  return (
    <div
      className="flex w-full items-center gap-3 rounded-lg bg-white p-4 text-left shadow-sm cursor-pointer"
      onClick={onOpenProfile}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpenProfile()}
    >
      <UserAvatar name={displayName} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0F172A]">{displayName}</p>
        <p className="truncate text-xs text-[#64748B]">{displayBio}</p>
      </div>
      {!isCurrentUser && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          className="border-neutral-200"
          onClick={(event) => {
            event.stopPropagation()
            void onToggleFollow()
          }}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  )
}
