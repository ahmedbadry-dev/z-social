"use client"

import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { Camera } from "lucide-react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { api } from "../../../convex/_generated/api"
import { useUploadThing } from "@/lib/uploadthing"

interface ProfileHeaderProps {
  userId: string
  name: string
  email: string
  image?: string
  username?: string
  bio?: string
  coverImageUrl?: string
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
  username,
  bio,
  coverImageUrl,
  postsCount,
  followersCount,
  followingCount,
  isFollowing,
  isOwnProfile,
}: ProfileHeaderProps) {
  const toggleFollow = useMutation(api.follows.toggleFollow)
  const [following, setFollowing] = useState(isFollowing)
  const [followers, setFollowers] = useState(followersCount)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { startUpload, isUploading } = useUploadThing("avatar")
  const updateProfile = useMutation(api.users.updateUserProfile)

  const onToggleFollow = async () => {
    const next = !following
    setFollowing(next)
    setFollowers((prev) => (next ? prev + 1 : prev - 1))
    try {
      await toggleFollow({ targetUserId: userId })
    } catch (error) {
      setFollowing(!next)
      setFollowers((prev) => (next ? prev - 1 : prev + 1))
      toast.error("Failed to follow user")
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await startUpload([file])
      if (!result?.[0]) throw new Error("Upload failed")

      await updateProfile({ coverImageUrl: result[0].ufsUrl })
      toast.success("Cover image updated!")
    } catch {
      toast.error("Failed to update cover image")
    }
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      {/* Cover image */}
      <div
        className="relative h-[120px] bg-[#E2E8F0]"
        style={coverImageUrl ? {
          backgroundImage: `url(${coverImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : undefined}
      >
        {isOwnProfile && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            <button
              type="button"
              onClick={() => !isUploading && coverInputRef.current?.click()}
              disabled={isUploading}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-black/40 px-2.5 py-1.5 text-xs text-white hover:bg-black/60 transition-colors disabled:opacity-60"
            >
              <Camera className="size-3.5" />
              {isUploading ? "Uploading..." : "Edit cover"}
            </button>
          </>
        )}
        <UserAvatar
          name={name}
          imageUrl={image}
          size="xl"
          className="absolute bottom-0 left-6 translate-y-1/2 border-4 border-white"
        />
      </div>

      <div className="px-6 pt-12 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            {/* Name + @username */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A]">{name}</h1>
              {username && (
                <span className="text-sm text-[#64748B]">/ @{username}</span>
              )}
            </div>
            {/* Bio or email */}
            <p className="text-sm text-[#64748B]">
              {bio ?? email}
            </p>
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
          {[
            { label: "Posts", value: postsCount },
            { label: "Followers", value: followers },
            { label: "Following", value: followingCount },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold text-[#0F172A]">{value}</p>
              <p className="text-xs text-[#64748B]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}