"use client"

import { useQueryState } from "nuqs"
import { useQuery } from "convex/react"
import { MyPostsTab } from "@/components/profile/my-posts-tab"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { SavedPostsTab } from "@/components/profile/saved-posts-tab"
import { PostSkeleton } from "@/components/shared/post-skeleton"
import { api } from "../../../convex/_generated/api"
import { useEffect } from "react"

export function ProfileContent() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  console.log("currentUser:", currentUser)
  console.log("userId:", currentUser?.userId)
  const profile = useQuery(
    api.users.getUserProfile,
    currentUser?._id ? { userId: currentUser._id } : "skip"
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


  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-sm">
      <ProfileHeader
        userId={userId}
        name={currentUser.name ?? "User"}
        email={currentUser.email}
        image={currentUser.image ?? undefined}
        postsCount={profile.postsCount}
        followersCount={profile.followersCount}
        followingCount={profile.followingCount}
        isFollowing={profile.isFollowing}
        isOwnProfile={profile.isOwnProfile}
      />

      <ProfileTabs
        activeTab={normalizedTab}
        isOwnProfile={canViewSettings}
        onTabChange={(tab) => void setActiveTab(tab)}
      />

      {normalizedTab === "posts" && <MyPostsTab userId={userId} />}
      {normalizedTab === "saved" && <SavedPostsTab />}
      {normalizedTab === "settings" && canViewSettings && <ProfileSettings />}
    </section>
  )
}
