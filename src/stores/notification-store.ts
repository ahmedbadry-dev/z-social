import { create } from "zustand"

interface NotificationStore {
  unreadNotificationsCount: number
  unreadMessagesCount: number
  setUnreadNotificationsCount: (count: number) => void
  setUnreadMessagesCount: (count: number) => void
  reset: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadNotificationsCount: 0,
  unreadMessagesCount: 0,

  setUnreadNotificationsCount: (count) =>
    set({ unreadNotificationsCount: count }),

  setUnreadMessagesCount: (count) =>
    set({ unreadMessagesCount: count }),

  reset: () => set({ unreadNotificationsCount: 0, unreadMessagesCount: 0 }),
}))
