"use client"

import { useQuery } from "convex/react"
import { Users } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { UserListItem } from "@/components/profile/user-list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "../../../convex/_generated/api"

interface FollowersListProps {
  userId: string
}

function FollowersListSkeleton(): JSX.Element {
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
          </div>
        ))}
      </div>
    </div>
  )
}

export function FollowersList({ userId }: FollowersListProps): JSX.Element {
  const followers = useQuery(
    api.follows.getFollowers,
    userId ? { userId } : "skip"
  )

  if (!userId) {
    return (
      <EmptyState
        icon={Users}
        title="No user selected"
        description="Select a profile to view followers."
      />
    )
  }

  if (followers === undefined) {
    return <FollowersListSkeleton />
  }

  if (followers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No followers yet"
        description="When someone follows this profile, they will show up here."
      />
    )
  }

  return (
    <section className="rounded-lg bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h2 className="text-base font-semibold text-foreground">Followers</h2>
      </div>
      <div className="divide-y divide-border">
        {followers.map((follower) => (
          <UserListItem
            key={follower.userId}
            userId={follower.userId}
            name={follower.name}
            image={follower.image}
            isFollowedByMe={follower.isFollowedByMe}
            showFollowButton={false}
          />
        ))}
      </div>
    </section>
  )
}
