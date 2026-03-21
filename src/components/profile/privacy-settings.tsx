"use client"

import { useEffect, useState } from "react"
import { Lock, Eye, Moon } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { cn } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"

function ToggleButton({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border border-border transition",
        checked ? "bg-foreground" : "bg-muted",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background transition",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  )
}

export function PrivacySettings() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const profile = useQuery(
    api.users.getUserProfile,
    currentUser?.userId ? { userId: currentUser.userId } : "skip"
  )
  const updatePrivacySettings = useMutation(api.users.updatePrivacySettings)

  const [isPrivate, setIsPrivate] = useState(false)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)

  useEffect(() => {
    if (profile) {
      setIsPrivate(profile.isPrivate ?? false)
      setShowOnlineStatus(profile.showOnlineStatus ?? true)
    }
  }, [profile])

  const handlePrivateToggle = (value: boolean) => {
    setIsPrivate(value)
    void updatePrivacySettings({ isPrivate: value })
  }

  const handleOnlineStatusToggle = (value: boolean) => {
    setShowOnlineStatus(value)
    void updatePrivacySettings({ showOnlineStatus: value })
  }

  const isDisabled = !currentUser

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between py-4 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="size-4 text-muted-foreground" />
            Private Account
          </div>
          <p className="text-xs text-muted-foreground">
            Only your followers can see your posts
          </p>
        </div>
        <ToggleButton
          checked={isPrivate}
          disabled={isDisabled}
          onChange={handlePrivateToggle}
        />
      </div>

      <div className="flex items-center justify-between py-4 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="size-4 text-muted-foreground" />
            Online Status
          </div>
          <p className="text-xs text-muted-foreground">
            Show when you're active in messages
          </p>
        </div>
        <ToggleButton
          checked={showOnlineStatus}
          disabled={isDisabled}
          onChange={handleOnlineStatusToggle}
        />
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Moon className="size-4 text-muted-foreground" />
            Appearance
          </div>
          <p className="text-xs text-muted-foreground">
            Switch between dark and light theme
          </p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
