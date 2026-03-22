"use client"

import { useQuery } from "convex/react"
import { ArrowLeft, Lock, UserCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EmptyState } from "@/components/shared/empty-state"
import { UserListItem } from "@/components/profile/user-list-item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "../../../convex/_generated/api"
import { cn } from "@/lib/utils"

interface FollowingListProps {
  userId: string
}

function ListSkeleton() {
  return (
    <div className="rounded-lg bg-card shadow-sm">
      <div className="flex border-b border-border">
        <div className="h-11 flex-1 animate-pulse bg-muted rounded-tl-lg" />
        <div className="h-11 flex-1 animate-pulse bg-muted rounded-tr-lg" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FollowingList({ userId }: FollowingListProps) {
  const router = useRouter()
  const currentUser = useQuery(api.auth.getCurrentUser)
  const profile = useQuery(
    api.users.getUserProfile,
    userId ? { userId } : "skip"
  )
  const followers = useQuery(
    api.follows.getFollowers,
    userId ? { userId } : "skip"
  )
  const following = useQuery(
    api.follows.getFollowing,
    userId ? { userId } : "skip"
  )

  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")

  if (!userId) {
    return (
      <EmptyState
        icon={UserCheck}
        title="No user selected"
        description="Select a profile to view following."
      />
    )
  }

  if (profile === undefined || followers === undefined || following === undefined) {
    return <ListSkeleton />
  }

  const isBlocked = !profile.isOwnProfile && (profile.isPrivate ?? false) && !profile.isFollowing
  if (isBlocked) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-card py-16 text-center shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border">
          <Lock className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">This account is private</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow this account to see their followers and following.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-3 md:hidden">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back()
            } else {
              router.push("/profile")
            }
          }}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>
      <section className="rounded-lg bg-card shadow-sm">
      <div className="flex border-b border-border">
        <Link
          href={`/profile/followers?userId=${userId}`}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors",
            "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Followers
          <span className="text-xs text-muted-foreground">({followers.length})</span>
        </Link>
        <Link
          href={`/profile/following?userId=${userId}`}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors",
            "border-b-2 border-[#3B55E6] text-foreground"
          )}
        >
          Following
          <span className="text-xs text-muted-foreground">({following.length})</span>
        </Link>
      </div>

      {following.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Not following anyone yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {following.map((item) => (
            <UserListItem
              key={item.userId}
              userId={item.userId}
              name={item.name}
              image={item.image}
              isFollowedByMe={item.isFollowedByMe}
              hasRequestedFollow={item.hasRequestedFollow}
              isCurrentUser={item.userId === currentUserId}
              showFollowButton={true}
            />
          ))}
        </div>
      )}
      </section>
    </>
  )
}
