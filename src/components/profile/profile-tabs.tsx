"use client"

import { cn } from "@/lib/utils"

interface ProfileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOwnProfile: boolean
}

export function ProfileTabs({ activeTab, onTabChange, isOwnProfile }: ProfileTabsProps) {
  const tabs = isOwnProfile
    ? [
        { key: "posts", label: "My Posts" },
        { key: "saved", label: "Saved Posts" },
        { key: "settings", label: "Settings" },
      ]
    : [{ key: "posts", label: "Posts" }]

  return (
    <div className="border-b border-border bg-card px-6">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={cn(
              "border-b-2 border-transparent px-1 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
              activeTab === tab.key && "border-foreground font-semibold text-foreground"
            )}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
