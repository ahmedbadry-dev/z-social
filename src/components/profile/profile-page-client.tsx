"use client"

import { Authenticated } from "convex/react"
import { ProfileContent } from "@/components/profile/profile-content"

export function ProfilePageClient() {
  return (
    <Authenticated>
      <ProfileContent />
    </Authenticated>
  )
}
