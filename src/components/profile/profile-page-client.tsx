"use client"

import { Authenticated } from "convex/react"
import { ProfileContent } from "@/components/profile/profile-content"

interface ProfilePageClientProps {
  targetUserId?: string
}

export function ProfilePageClient({ targetUserId }: ProfilePageClientProps) {
  return (
    <Authenticated>
      <ProfileContent targetUserId={targetUserId} />
    </Authenticated>
  )
}
