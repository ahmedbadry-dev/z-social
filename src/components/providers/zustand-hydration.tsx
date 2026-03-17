"use client"

import { useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useNotificationStore } from "@/stores/notification-store"
import { useAuthStore } from "@/stores/auth-store"

export function ZustandHydration() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const unreadNotifications = useQuery(api.notifications.getUnreadNotificationsCount)
  const unreadMessages = useQuery(api.messages.getUnreadCount)

  const { setUnreadNotificationsCount, setUnreadMessagesCount } = useNotificationStore()
  const { setCachedUser, clearCachedUser } = useAuthStore()

  useEffect(() => {
    if (currentUser) {
      setCachedUser({
        id: String(currentUser._id),
        name: currentUser.name ?? "",
        email: currentUser.email,
        image: currentUser.image ?? undefined,
      })
    } else if (currentUser === null) {
      clearCachedUser()
    }
  }, [currentUser, setCachedUser, clearCachedUser])

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
