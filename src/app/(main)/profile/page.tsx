"use client"

import { Authenticated } from "convex/react"
import { ProfileContent } from "@/components/profile/profile-content"

export default function ProfilePage() {
  return (
    <Authenticated>
      <ProfileContent />
    </Authenticated>
  )
}
