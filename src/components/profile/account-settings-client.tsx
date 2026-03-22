"use client"

import { Authenticated } from "convex/react"
import { AccountSettings } from "@/components/profile/account-settings"

export function AccountSettingsClient() {
  return (
    <Authenticated>
      <AccountSettings />
    </Authenticated>
  )
}
