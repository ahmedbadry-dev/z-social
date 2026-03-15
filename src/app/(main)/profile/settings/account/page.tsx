"use client"

import { Authenticated } from "convex/react"
import { AccountSettings } from "@/components/profile/account-settings"

export default function AccountSettingsPage() {
  return (
    <Authenticated>
      <AccountSettings />
    </Authenticated>
  )
}
