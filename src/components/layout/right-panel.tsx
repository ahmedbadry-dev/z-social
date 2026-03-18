"use client"

import { Check, Plus } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { useMemo, useState } from "react"
import { UserAvatar } from "@/components/shared/user-avatar"
import { api } from "../../../convex/_generated/api"

type FollowStateMap = Record<string, boolean>

export function RightPanel() {
  const suggestedUsers = useQuery(api.users.getSuggestedUsers)
  const toggleFollow = useMutation(api.follows.toggleFollow)
  const [followMap, setFollowMap] = useState<FollowStateMap>({})

  const suggestions = useMemo(() => suggestedUsers ?? [], [suggestedUsers])
  const hasSuggestions = suggestions.length > 0

  const onToggleFollow = async (targetUserId: string) => {
    const result = await toggleFollow({ targetUserId })
    setFollowMap((prev) => ({
      ...prev,
      [targetUserId]: result.following,
    }))
  }

  return (
    <div className="flex h-fit flex-col gap-4">
      {suggestedUsers === undefined && (
        <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded bg-[#E2E8F0]" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="size-9 animate-pulse rounded-full bg-[#E2E8F0]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-[#E2E8F0]" />
                <div className="h-2.5 w-24 animate-pulse rounded bg-[#E2E8F0]" />
              </div>
              <div className="size-7 animate-pulse rounded-full bg-[#E2E8F0]" />
            </div>
          ))}
        </div>
      )}

      {hasSuggestions && (
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[#0F172A]">Suggested Friends</h2>
          <div className="space-y-3">
            {suggestions.map((item) => {
              const isFollowing = followMap[item.userId] ?? false
              return (
                <div key={item.userId} className="flex items-center gap-2">
                  <UserAvatar name={item.userId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {item.name ?? item.userId.slice(0, 12) + "..."}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">Suggested for you</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full border border-neutral-200 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                    aria-label={isFollowing ? "Unfollow user" : "Follow user"}
                    onClick={() => void onToggleFollow(item.userId)}
                  >
                    {isFollowing ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <footer className="mt-auto px-2 pb-2 text-center text-xs text-[#94A3B8]">
        <p>© 2023 DevCut. All rights reserved.</p>
        <p className="mt-1">About · Help · Privacy & Terms</p>
      </footer>
    </div>
  )
}
