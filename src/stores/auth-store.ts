import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CachedUser {
  id: string
  userId: string
  name: string
  email: string
  image?: string
}

interface AuthStore {
  cachedUser: CachedUser | null
  setCachedUser: (user: CachedUser) => void
  clearCachedUser: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      cachedUser: null,
      setCachedUser: (user) => set({ cachedUser: user }),
      clearCachedUser: () => set({ cachedUser: null }),
    }),
    {
      name: "social-auth-cache",
    }
  )
)
