"use client"

import { useEffect } from "react"
import { Lock } from "lucide-react"
import { useQueryState } from "nuqs"
import { Authenticated, useQuery } from "convex/react"
import { MyPostsTab } from "@/components/profile/my-posts-tab"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { SavedPostsTab } from "@/components/profile/saved-posts-tab"
import { RightPanel } from "@/components/layout/right-panel"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { api } from "../../../convex/_generated/api"

interface ProfileContentProps {
  targetUserId?: string
}

export function ProfileContent({ targetUserId }: ProfileContentProps) {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const currentUserId = currentUser?.userId ?? String(currentUser?._id ?? "")
  const profileUserId = targetUserId ?? currentUserId
  const isViewingOwnProfile = !targetUserId || targetUserId === currentUserId
  const profile = useQuery(
    api.users.getUserProfile,
    profileUserId ? { userId: profileUserId } : "skip"
  )
  const targetUser = useQuery(
    api.users.getUserById,
    targetUserId && !isViewingOwnProfile ? { userId: targetUserId } : "skip"
  )
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "posts",
  })

  useEffect(() => {
    if (!isViewingOwnProfile && activeTab !== "posts") {
      void setActiveTab("posts")
    }
  }, [activeTab, isViewingOwnProfile, setActiveTab])

  const isTargetLoading =
    targetUserId && !isViewingOwnProfile && targetUser === undefined

  if (currentUser === undefined || profile === undefined || isTargetLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  const userId = profileUserId
  const canViewSettings = isViewingOwnProfile
  const normalizedTab = canViewSettings ? activeTab : "posts"
  const isSettingsTab = normalizedTab === "settings"
  const displayName = isViewingOwnProfile
    ? currentUser.name ?? "User"
    : targetUser?.name ?? profile.name ?? profile.username ?? "User"
  const displayEmail = isViewingOwnProfile ? currentUser.email ?? "" : ""
  const displayImage = isViewingOwnProfile
    ? currentUser.image ?? undefined
    : targetUser?.image ?? profile.image ?? undefined

  return (
    <div className="space-y-4">
      <ProfileHeader
        userId={userId}
        name={displayName}
        email={displayEmail}
        image={displayImage}
        username={profile.username ?? undefined}
        bio={profile.bio ?? undefined}
        coverImageUrl={profile.coverImageUrl ?? undefined}
        postsCount={profile.postsCount}
        followersCount={profile.followersCount}
        followingCount={profile.followingCount}
        isFollowing={profile.isFollowing}
        isOwnProfile={isViewingOwnProfile}
        isPrivate={profile.isPrivate}
        hasRequestedFollow={profile.hasRequestedFollow}
        isFollowedByMe={profile.isFollowedByMe}
      />

      <div className="rounded-lg bg-white shadow-sm">
        <ProfileTabs
          activeTab={normalizedTab}
          isOwnProfile={canViewSettings}
          onTabChange={(tab) => void setActiveTab(tab)}
        />
      </div>

      {isSettingsTab ? (
        <div>{canViewSettings && <ProfileSettings />}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="min-w-0">
            {!profile.canViewPosts && !isViewingOwnProfile ? (
              <div className="flex flex-col items-center justify-center rounded-lg bg-card py-16 text-center shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border">
                  <Lock className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  This account is private
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.hasRequestedFollow
                    ? "Your follow request is pending approval."
                    : "Follow this account to see their posts."}
                </p>
              </div>
            ) : (
              <>
                {normalizedTab === "posts" && <MyPostsTab userId={userId} />}
                {normalizedTab === "saved" && canViewSettings && <SavedPostsTab />}
              </>
            )}
          </div>
          <aside className="hidden lg:block">
            <Authenticated>
              <RightPanel />
            </Authenticated>
          </aside>
        </div>
      )}
    </div>
  )
}
