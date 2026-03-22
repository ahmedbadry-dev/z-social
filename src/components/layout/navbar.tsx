"use client"

import { motion, useMotionValueEvent, useScroll } from "motion/react"
import { Heart, Search } from "lucide-react"
import { type Preloaded, usePreloadedQuery, useQuery } from "convex/react"
import { useQueryState } from "nuqs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SocialLogo } from "@/components/auth/social-logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { api } from "../../../convex/_generated/api"

interface NavbarProps {
  preloadedUser?: Preloaded<typeof api.auth.getCurrentUser>
}

export function Navbar({ preloadedUser }: NavbarProps) {
  const router = useRouter()
  const [hidden, setHidden] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { scrollY } = useScroll()
  const [q, setQ] = useQueryState("q", { defaultValue: "" })
  const [inputValue, setInputValue] = useState(q)
  const currentUser = preloadedUser
    ? usePreloadedQuery(preloadedUser)
    : useQuery(api.auth.getCurrentUser)
  const unreadNotifications = useQuery(api.notifications.getUnreadNotificationsCount) ?? 0
  void currentUser

  useEffect(() => {
    setInputValue(q)
  }, [q])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    if (latest > previous && latest > 100) {
      setHidden(true)
    } else {
      setHidden(false)
    }
  })

  const submitSearch = async () => {
    const value = inputValue.trim()
    await setQ(value)
    router.push(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden && isMobile ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="navbar sticky top-0 z-50 border-b border-border bg-card"
    >
      <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between gap-4 px-4">
        <Link href="/feed" aria-label="Go to home feed">
          <SocialLogo />
        </Link>

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

        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        <Link href="/notifications" className="relative md:hidden" aria-label="Notifications">
          <Heart className="size-5 text-foreground" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#3B55E6] ring-2 ring-card" />
          )}
        </Link>
      </div>
    </motion.header>
  )
}
