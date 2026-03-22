"use client"

import { Plus } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"

type FollowStateMap = Record<string, boolean>

function getDisplayName(userId: string) {
  if (userId.length <= 16) return userId
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`
}

export function RightPanel() {
  const suggestedUsers = useQuery(api.users.getSuggestedUsers)
  const followUser = useMutation(api.follows.followUser)
  const [followMap, setFollowMap] = useState<FollowStateMap>({})
  const [requestedMap, setRequestedMap] = useState<FollowStateMap>({})

  const suggestions = useMemo(() => suggestedUsers ?? [], [suggestedUsers])
  const hasSuggestions = suggestions.length > 0

  const seededRef = useRef("")
  const seedKey = suggestions.map((user) => user.userId).join(",")
  if (seedKey && seededRef.current !== seedKey) {
    seededRef.current = seedKey
    const newFollowMap: FollowStateMap = {}
    const newRequestedMap: FollowStateMap = {}
    for (const user of suggestions) {
      newFollowMap[user.userId] = user.isFollowing
      newRequestedMap[user.userId] = user.hasRequestedFollow
    }
    setFollowMap(newFollowMap)
    setRequestedMap(newRequestedMap)
  }

  const onToggleFollow = async (targetUserId: string) => {
    try {
      const result = await followUser({ targetUserId })

      if (result.action === "followed") {
        setFollowMap((prev) => ({ ...prev, [targetUserId]: true }))
        setRequestedMap((prev) => ({ ...prev, [targetUserId]: false }))
      } else if (result.action === "unfollowed") {
        setFollowMap((prev) => ({ ...prev, [targetUserId]: false }))
        setRequestedMap((prev) => ({ ...prev, [targetUserId]: false }))
      } else if (result.action === "request_sent") {
        setRequestedMap((prev) => ({ ...prev, [targetUserId]: true }))
      } else if (result.action === "request_cancelled") {
        setRequestedMap((prev) => ({ ...prev, [targetUserId]: false }))
      }
    } catch {
      toast.error("Failed")
    }
  }

  return (
    <div className="flex h-fit flex-col gap-4">
      {suggestedUsers === undefined && (
        <div className="space-y-3 rounded-lg bg-card p-4 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="size-9 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="size-7 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}

      {hasSuggestions && (
        <section className="rounded-lg bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Suggested Friends</h2>
          <div className="space-y-3">
            {suggestions.map((item) => {
              const isFollowing = followMap[item.userId] ?? false
              const isRequested = requestedMap[item.userId] ?? false
              const buttonLabel = isFollowing ? "Following" : isRequested ? "Requested" : "+"
              const displayName = item.name?.trim() || getDisplayName(item.userId)
              return (
                <div key={item.userId} className="flex items-center gap-2">
                  <Link
                    href={`/profile?userId=${item.userId}`}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <UserAvatar
                      name={displayName}
                      imageUrl={item.image ?? undefined}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">Suggested for you</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-7 items-center justify-center rounded-full border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={isFollowing ? "Unfollow user" : isRequested ? "Requested" : "Follow user"}
                    onClick={() => void onToggleFollow(item.userId)}
                  >
                    {buttonLabel === "+" ? <Plus className="size-4" /> : buttonLabel}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <footer className="mt-auto px-2 pb-2 text-center text-xs text-muted-foreground">
        <p>© 2023 DevCut. All rights reserved.</p>
        <p className="mt-1">About · Help · Privacy & Terms</p>
      </footer>
    </div>
  )
}
