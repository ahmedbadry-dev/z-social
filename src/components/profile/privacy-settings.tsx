"use client"

import { useEffect, useState } from "react"
import { Lock, Eye, Moon } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
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

  const handlePrivateToggle = async (value: boolean) => {
    const previous = isPrivate
    setIsPrivate(value)
    try {
      await updatePrivacySettings({ isPrivate: value })
    } catch (error) {
      setIsPrivate(previous)
      const message = error instanceof Error ? error.message : "Failed to update privacy settings"
      toast.error(message)
    }
  }

  const handleOnlineStatusToggle = async (value: boolean) => {
    const previous = showOnlineStatus
    setShowOnlineStatus(value)
    try {
      await updatePrivacySettings({ showOnlineStatus: value })
    } catch (error) {
      setShowOnlineStatus(previous)
      const message = error instanceof Error ? error.message : "Failed to update online status"
      toast.error(message)
    }
  }

  const isDisabled = !currentUser

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 py-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="size-4 text-muted-foreground" />
            Private Account
          </div>
          <p className="text-xs text-muted-foreground">
            Only your followers can see your posts
          </p>
        </div>
        <div className="flex justify-end sm:justify-start">
          <ToggleButton
            checked={isPrivate}
            disabled={isDisabled}
            onChange={handlePrivateToggle}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 py-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="size-4 text-muted-foreground" />
            Show Online Status
          </div>
          <p className="text-xs text-muted-foreground">
            When off, others won't see when you're active or last seen
          </p>
        </div>
        <div className="flex justify-end sm:justify-start">
          <ToggleButton
            checked={showOnlineStatus}
            disabled={isDisabled}
            onChange={handleOnlineStatusToggle}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Moon className="size-4 text-muted-foreground" />
            Appearance
          </div>
          <p className="text-xs text-muted-foreground">
            Switch between dark and light theme
          </p>
        </div>
        <div className="flex justify-end sm:justify-start">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
