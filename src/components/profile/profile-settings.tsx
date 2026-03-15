"use client"

import { useQueryState } from "nuqs"
import { authClient } from "@/lib/auth-client"
import { AccountSettings } from "@/components/profile/account-settings"
import { GeneralSettings } from "@/components/profile/general-settings"
import { cn } from "@/lib/utils"

export function ProfileSettings() {
  const [activeSetting, setActiveSetting] = useQueryState("setting", {
    defaultValue: "general",
  })

  const settings = [
    { key: "general", label: "General" },
    { key: "account", label: "Account" },
  ]

  const onLogout = async () => {
    await authClient.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[160px_1fr]">
      <aside className="space-y-1">
        {settings.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn(
              "w-full rounded-md px-3 py-2 text-left text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]",
              activeSetting === item.key && "bg-[#F1F5F9] font-semibold text-[#0F172A]"
            )}
            onClick={() => void setActiveSetting(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="w-full rounded-md px-3 py-2 text-left text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          onClick={() => void onLogout()}
        >
          Logout
        </button>
      </aside>

      <div>{activeSetting === "account" ? <AccountSettings /> : <GeneralSettings />}</div>
    </div>
  )
}
