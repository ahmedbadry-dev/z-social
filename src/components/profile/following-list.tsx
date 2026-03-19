"use client"

import { useQuery } from "convex/react"
import { UserCheck } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { UserListItem } from "@/components/profile/user-list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "../../../convex/_generated/api"

interface FollowingListProps {
  userId: string
}

function FollowingListSkeleton(): JSX.Element {
  return (
    <div className="rounded-lg bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FollowingList({ userId }: FollowingListProps): JSX.Element {
  const following = useQuery(
    api.follows.getFollowing,
    userId ? { userId } : "skip"
  )

  if (!userId) {
    return (
      <EmptyState
        icon={UserCheck}
        title="No user selected"
        description="Select a profile to view following."
      />
    )
  }

  if (following === undefined) {
    return <FollowingListSkeleton />
  }

  if (following.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="Not following anyone yet"
        description="When this profile follows someone, they will show up here."
      />
    )
  }

  return (
    <section className="rounded-lg bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h2 className="text-base font-semibold text-foreground">Following</h2>
      </div>
      <div className="divide-y divide-border">
        {following.map((item) => (
          <UserListItem
            key={item.userId}
            userId={item.userId}
            name={item.name}
            image={item.image}
            isFollowedByMe={item.isFollowedByMe}
            showFollowButton
          />
        ))}
      </div>
    </section>
  )
}
