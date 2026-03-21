"use client"

import { LogOut, Search, UserRound } from "lucide-react"
import { type Preloaded, usePreloadedQuery, useQuery } from "convex/react"
import { useQueryState } from "nuqs"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { SocialLogo } from "@/components/auth/social-logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { authClient } from "@/lib/auth-client"
import { useAuthStore } from "@/stores/auth-store"
import { useNotificationStore } from "@/stores/notification-store"
import { useUIStore } from "@/stores/ui-store"
import { api } from "../../../convex/_generated/api"

interface NavbarProps {
  preloadedUser?: Preloaded<typeof api.auth.getCurrentUser>
}

export function Navbar({ preloadedUser }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useQueryState("q", { defaultValue: "" })
  const [inputValue, setInputValue] = useState(q)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { clearCachedUser } = useAuthStore()
  const { reset: resetNotifications } = useNotificationStore()
  const { closeModal, closeMobileSidebar } = useUIStore()
  const currentUser = preloadedUser
    ? usePreloadedQuery(preloadedUser)
    : useQuery(api.auth.getCurrentUser)

  useEffect(() => {
    setInputValue(q)
  }, [q])

  const submitSearch = async () => {
    const value = inputValue.trim()
    await setQ(value)
    router.push(`/search?q=${encodeURIComponent(value)}`)
  }

  const onLogout = async () => {
    setIsLoggingOut(true)
    try {
      clearCachedUser()
      resetNotifications()
      closeModal()
      closeMobileSidebar()
      await authClient.signOut()
      window.location.href = "/login"
    } catch {
      toast.error("Failed to log out")
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between gap-4 px-4">
        <SocialLogo />

        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-[360px]">
            <input
              value={inputValue}
              placeholder="Search"
              className="h-10 w-full rounded-full bg-muted py-2 pr-10 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void submitSearch()
                }
              }}
            />
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <button
              type="button"
              aria-label="Submit search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => void submitSearch()}
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>

        <ThemeToggle />

        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-[#3B55E6] disabled:opacity-60"
          disabled={isLoggingOut}
          onClick={() => void onLogout()}
        >
          <UserRound className="size-4" />
          <span className="hidden sm:inline">{isLoggingOut ? "Logging out..." : "Logout"}</span>
          <LogOut className="size-4 sm:hidden" />
        </button>
      </div>
    </header>
  )
}
