"use client"

import { useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useNotificationStore } from "@/stores/notification-store"
import { useAuthStore } from "@/stores/auth-store"

export function ZustandHydration() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const unreadNotifications = useQuery(api.notifications.getUnreadNotificationsCount)
  const unreadMessages = useQuery(api.messages.getUnreadCount)
  const upsertUser = useMutation(api.users.upsertUser)
  const setUsernameIfMissing = useMutation(api.users.setUsernameIfMissing)
  const updatePresence = useMutation(api.messages.updatePresence)

  const { setUnreadNotificationsCount, setUnreadMessagesCount } = useNotificationStore()
  const { setCachedUser, clearCachedUser } = useAuthStore()

  useEffect(() => {
    if (currentUser) {
      void upsertUser()
      setCachedUser({
        id: String(currentUser._id),
        userId: currentUser.userId ?? String(currentUser._id),
        name: currentUser.name ?? "",
        email: currentUser.email,
        image: currentUser.image ?? undefined,
      })
    } else if (currentUser === null) {
      clearCachedUser()
    }
  }, [currentUser, setCachedUser, clearCachedUser, upsertUser])

  useEffect(() => {
    if (!currentUser) return
    if (typeof window === "undefined") return

    const pendingUsername = localStorage.getItem("pending-username")
    const pendingEmail = localStorage.getItem("pending-email")
    if (!pendingUsername) return
    if (pendingEmail && pendingEmail !== currentUser.email?.toLowerCase()) return

    const applyUsername = async () => {
      try {
        const result = await setUsernameIfMissing({ username: pendingUsername })
        if (result?.status === "updated" || result?.status === "skipped") {
          localStorage.removeItem("pending-username")
          localStorage.removeItem("pending-email")
        }
      } catch {
        // keep pending username for retry on next load
      }
    }

    void applyUsername()
  }, [currentUser, setUsernameIfMissing])

  useEffect(() => {
    if (!currentUser) return

    void updatePresence({ isTypingTo: undefined })

    const interval = setInterval(() => {
      void updatePresence({ isTypingTo: undefined })
    }, 60_000)

    return () => clearInterval(interval)
  }, [currentUser, updatePresence])

  useEffect(() => {
    if (unreadNotifications !== undefined) {
      setUnreadNotificationsCount(unreadNotifications)
    }
  }, [unreadNotifications, setUnreadNotificationsCount])

  useEffect(() => {
    if (unreadMessages !== undefined) {
      setUnreadMessagesCount(unreadMessages)
    }
  }, [unreadMessages, setUnreadMessagesCount])

  return null
}
