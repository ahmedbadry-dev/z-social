"use client"

import { useQuery } from "convex/react"
import { Authenticated, AuthLoading } from "convex/react"
import { Bell, Home, Send, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { api } from "../../../convex/_generated/api"
import { UserAvatar } from "@/components/shared/user-avatar"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/messages", label: "Messages", icon: Send },
  { href: "/notifications", label: "Notifications", icon: Bell },
]

function SidebarSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="h-20 bg-[#E2E8F0]" />
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-3 size-12 animate-pulse rounded-full bg-[#E2E8F0]" />
        <div className="mb-2 h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />
        <div className="h-3 w-32 animate-pulse rounded bg-[#E2E8F0]" />
      </div>
    </div>
  )
}

function SidebarContent() {
  const pathname = usePathname()
  const currentUser = useQuery(api.auth.getCurrentUser)
  const unreadNotifications = useQuery(api.notifications.getUnreadNotificationsCount)
  const unreadMessages = useQuery(api.messages.getUnreadCount)

  const userProfile = useQuery(
    api.users.getUserProfile,
    currentUser?._id ? { userId: String(currentUser._id) } : "skip"
  )

  const displayName =
    currentUser?.name?.trim() ||
    currentUser?.email?.split("@")[0] ||
    "User"

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="relative h-20 bg-[#E2E8F0]">
        {/* Cover */}
        <div
          className="relative h-20"
          style={
            userProfile?.coverImageUrl
              ? {
                backgroundImage: `url(${userProfile.coverImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
              : { backgroundColor: "#E2E8F0" }
          }
        >
          <UserAvatar
            name={displayName}
            imageUrl={currentUser?.image ?? undefined}
            size="lg"
            className="absolute bottom-0 left-4 translate-y-1/2 border-2 border-white"
          />
        </div>
      </div>
      <div className="border-b border-neutral-200 px-4 pt-8 pb-4">
        <p className="text-base font-semibold text-[#0F172A]">{displayName}</p>
        <p className="max-w-[160px] truncate text-sm text-[#64748B]">
          {currentUser?.email ?? ""}
        </p>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          const showNotificationsBadge = href === "/notifications" && !!unreadNotifications && unreadNotifications > 0
          const showMessagesBadge = href === "/messages" && !!unreadMessages && unreadMessages > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]",
                isActive && "bg-[#F1F5F9] font-semibold text-[#0F172A]"
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
              {showNotificationsBadge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
              {showMessagesBadge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar() {
  return (
    <>
      <AuthLoading><SidebarSkeleton /></AuthLoading>
      <Authenticated><SidebarContent /></Authenticated>
    </>
  )
}
