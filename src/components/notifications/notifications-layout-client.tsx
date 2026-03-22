"use client"

import { useEffect, type ReactNode } from "react"

export function NotificationsLayoutClient({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("notifications-open")
    return () => {
      document.documentElement.classList.remove("notifications-open")
    }
  }, [])

  return <>{children}</>
}
