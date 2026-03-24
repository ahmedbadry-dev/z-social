"use client"

import { useQueryState } from "nuqs"
import { AccountSettings } from "@/components/profile/account-settings"
import { GeneralSettings } from "@/components/profile/general-settings"
import { PrivacySettings } from "@/components/profile/privacy-settings"
import { cn } from "@/lib/utils"

export function ProfileSettings() {
  const [activeSetting, setActiveSetting] = useQueryState("setting", {
    defaultValue: "general",
  })

  const settings = [
    { key: "general", label: "General" },
    { key: "privacy", label: "Privacy" },
    { key: "account", label: "Account" },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[160px_1fr]">
      <aside className="flex flex-wrap gap-2 md:flex-col md:gap-1">
        {settings.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn(
              "rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground md:w-full",
              activeSetting === item.key && "bg-muted font-semibold text-foreground"
            )}
            onClick={() => void setActiveSetting(item.key)}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <div>
        {activeSetting === "general" && <GeneralSettings />}
        {activeSetting === "privacy" && <PrivacySettings />}
        {activeSetting === "account" && <AccountSettings />}
      </div>
    </div>
  )
}
