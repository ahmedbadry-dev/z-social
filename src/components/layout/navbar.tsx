"use client"

import { LogOut, Search, UserRound } from "lucide-react"
import { useQueryState } from "nuqs"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SocialLogo } from "@/components/auth/social-logo"
import { authClient } from "@/lib/auth-client"
import { useAuthStore } from "@/stores/auth-store"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useQueryState("q", { defaultValue: "" })
  const [inputValue, setInputValue] = useState(q)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { clearCachedUser } = useAuthStore()

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
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/login")
          },
        },
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between gap-4 px-4">
        <SocialLogo />

        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-[360px]">
            <input
              value={inputValue}
              placeholder="Search"
              className="h-10 w-full rounded-full bg-[#F1F5F9] py-2 pr-10 pl-10 text-sm text-[#0F172A] outline-none placeholder:text-[#64748B]"
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void submitSearch()
                }
              }}
            />
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#64748B]" />
            <button
              type="button"
              aria-label="Submit search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
              onClick={() => void submitSearch()}
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#0F172A] hover:text-[#3B55E6] disabled:opacity-60"
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
