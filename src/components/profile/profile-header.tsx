"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { api } from "../../../convex/_generated/api"

interface ProfileHeaderProps {
  userId: string
  name: string
  email: string
  image?: string
  postsCount: number
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isOwnProfile: boolean
}

export function ProfileHeader({
  userId,
  name,
  email,
  image,
  postsCount,
  followersCount,
  followingCount,
  isFollowing,
  isOwnProfile,
}: ProfileHeaderProps) {
  const toggleFollow = useMutation(api.follows.toggleFollow)
  const [following, setFollowing] = useState(isFollowing)
  const [followers, setFollowers] = useState(followersCount)

  const onToggleFollow = async () => {
    const next = !following
    setFollowing(next)
    setFollowers((prev) => (next ? prev + 1 : prev - 1))
    try {
      await toggleFollow({ targetUserId: userId })
    } catch (error) {
      setFollowing(!next)
      setFollowers((prev) => (next ? prev - 1 : prev + 1))
      const message = error instanceof Error ? error.message : "Failed to follow user"
      toast.error(message)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="relative h-[120px] bg-[#E2E8F0]">
        <UserAvatar
          name={name}
          imageUrl={image}
          size="xl"
          className="absolute bottom-0 left-6 translate-y-1/2 border-4 border-white"
        />
      </div>

      <div className="px-6 pt-12 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#0F172A]">{name}</h1>
            <p className="text-sm text-[#64748B]">{email}</p>
          </div>
          {!isOwnProfile && (
            <Button
              type="button"
              variant={following ? "default" : "outline"}
              className={following ? "bg-[#0F172A] text-white" : ""}
              onClick={() => void onToggleFollow()}
            >
              {following ? "Following" : "Follow"}
            </Button>
          )}
        </div>

        <div className="mt-5 flex items-center gap-8">
          <div className="text-center">
            <p className="text-lg font-bold text-[#0F172A]">{postsCount}</p>
            <p className="text-xs text-[#64748B]">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#0F172A]">{followers}</p>
            <p className="text-xs text-[#64748B]">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#0F172A]">{followingCount}</p>
            <p className="text-xs text-[#64748B]">Following</p>
          </div>
        </div>
      </div>
    </div>
  )
}
