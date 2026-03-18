"use client"

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

export function ProfileContent() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const profile = useQuery(
    api.users.getUserProfile,
    currentUser?._id ? { userId: String(currentUser._id) } : "skip"
  )
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "posts",
  })

  if (currentUser === undefined || profile === undefined) {
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

  const userId = String(currentUser._id)
  const canViewSettings = profile.isOwnProfile
  const normalizedTab = activeTab === "settings" && !canViewSettings ? "posts" : activeTab
  const isSettingsTab = normalizedTab === "settings"

  return (
    <div className="space-y-4">
      <ProfileHeader
        userId={userId}
        name={currentUser.name ?? "User"}
        email={currentUser.email}
        image={currentUser.image ?? undefined}
        username={profile.username ?? undefined}
        bio={profile.bio ?? undefined}
        coverImageUrl={profile.coverImageUrl ?? undefined}
        postsCount={profile.postsCount}
        followersCount={profile.followersCount}
        followingCount={profile.followingCount}
        isFollowing={profile.isFollowing}
        isOwnProfile={profile.isOwnProfile}
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
            {normalizedTab === "posts" && <MyPostsTab userId={userId} />}
            {normalizedTab === "saved" && <SavedPostsTab />}
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
