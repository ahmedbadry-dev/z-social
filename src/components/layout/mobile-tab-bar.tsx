"use client"

import { Authenticated } from "convex/react"
import { useQuery } from "convex/react"
import { Bell, House, Search, Send, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"

const tabs = [
  { href: "/feed", label: "Home", icon: House, key: "home" },
  { href: "/search", label: "Search", icon: Search, key: "search" },
  { href: "/messages", label: "Messages", icon: Send, key: "messages" },
  { href: "/notifications", label: "Alerts", icon: Bell, key: "notifications" },
  { href: "/profile", label: "Profile", icon: User, key: "profile" },
] as const

function TabBarContent() {
  const pathname = usePathname()
  const unreadMessages = useQuery(api.messages.getUnreadCount)
  const unreadNotifications = useQuery(api.notifications.getUnreadNotificationsCount)

  const getBadge = (key: (typeof tabs)[number]["key"]) => {
    if (key === "messages" && unreadMessages && unreadMessages > 0) return unreadMessages
    if (key === "notifications" && unreadNotifications && unreadNotifications > 0) return unreadNotifications
    return 0
  }

  return (
    <div className="grid h-full grid-cols-5">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        const badgeValue = getBadge(tab.key)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 text-[11px] text-[#94A3B8]",
              isActive && "text-[#3B55E6]"
            )}
          >
            <div className="relative">
              <Icon className="size-4" />
              {badgeValue > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">
                  {badgeValue > 99 ? "99+" : badgeValue}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function MobileTabBar() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 h-14 border-t border-neutral-200 bg-white md:hidden">
      <Authenticated>
        <TabBarContent />
      </Authenticated>
    </nav>
  )
}