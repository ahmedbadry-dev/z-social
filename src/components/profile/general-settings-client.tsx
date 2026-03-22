"use client"

import { Authenticated } from "convex/react"
import { GeneralSettings } from "@/components/profile/general-settings"

export function GeneralSettingsClient() {
  return (
    <Authenticated>
      <GeneralSettings />
    </Authenticated>
  )
}
