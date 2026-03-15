"use client"

import { Authenticated } from "convex/react"
import { GeneralSettings } from "@/components/profile/general-settings"

export default function GeneralSettingsPage() {
  return (
    <Authenticated>
      <GeneralSettings />
    </Authenticated>
  )
}
