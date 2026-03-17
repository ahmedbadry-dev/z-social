import { create } from "zustand"

interface UIStore {
  activeModal: "editPost" | "deletePost" | "deleteAccount" | null
  activePostId: string | null
  isMobileSidebarOpen: boolean
  openModal: (modal: UIStore["activeModal"], postId?: string) => void
  closeModal: () => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeModal: null,
  activePostId: null,
  isMobileSidebarOpen: false,

  openModal: (modal, postId) =>
    set({ activeModal: modal, activePostId: postId ?? null }),

  closeModal: () =>
    set({ activeModal: null, activePostId: null }),

  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  closeMobileSidebar: () =>
    set({ isMobileSidebarOpen: false }),
}))
