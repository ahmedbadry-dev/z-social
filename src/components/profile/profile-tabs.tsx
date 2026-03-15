"use client"

import { cn } from "@/lib/utils"

interface ProfileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOwnProfile: boolean
}

export function ProfileTabs({ activeTab, onTabChange, isOwnProfile }: ProfileTabsProps) {
  const tabs = [
    { key: "posts", label: "My Posts" },
    { key: "saved", label: "Saved Posts" },
    ...(isOwnProfile ? [{ key: "settings", label: "Settings" }] : []),
  ]

  return (
    <div className="border-b border-neutral-200 px-6">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={cn(
              "border-b-2 border-transparent px-1 py-3 text-sm text-[#64748B] transition-colors hover:text-[#0F172A]",
              activeTab === tab.key && "border-[#0F172A] font-semibold text-[#0F172A]"
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
