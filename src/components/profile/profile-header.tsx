"use client"

import { AnimatePresence, motion } from "motion/react"
import { useRef, useState } from "react"
import { useMutation } from "convex/react"
import { Camera, MessageCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { api } from "../../../convex/_generated/api"
import { useUploadThing } from "@/lib/uploadthing"
import { cn } from "@/lib/utils"

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
    <div className="overflow-hidden rounded-lg bg-card shadow-sm">
      {/* Cover image */}
      <div
        className="relative h-[120px] bg-muted"
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
              <h1 className="text-xl font-bold text-foreground">{name}</h1>
              {username && (
                <span className="text-sm text-muted-foreground">/ @{username}</span>
              )}
            </div>
            {/* Bio or email */}
            <p className="text-sm text-muted-foreground">
              {bio ?? email}
            </p>
          </div>
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => void onToggleFollow()}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                  following
                    ? "bg-muted text-foreground border border-border"
                    : "bg-[#3B55E6] text-white"
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={following ? "following" : "follow"}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {following ? "Following" : "Follow"}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              <Link href={`/messages?userId=${userId}`}>
                <Button type="button" variant="outline" size="icon">
                  <MessageCircle className="size-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center gap-8">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{postsCount}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>

          <Link
            href={`/profile/followers?userId=${userId}`}
            className="text-center hover:opacity-75 transition-opacity"
          >
            <p className="text-lg font-bold text-foreground">{followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </Link>

          <Link
            href={`/profile/following?userId=${userId}`}
            className="text-center hover:opacity-75 transition-opacity"
          >
            <p className="text-lg font-bold text-foreground">{followingCount}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
