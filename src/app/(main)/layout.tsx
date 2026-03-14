import { AuthRedirect } from "@/components/auth/auth-redirect"
import { MobileTabBar } from "@/components/layout/mobile-tab-bar"
import { Navbar } from "@/components/layout/navbar"
import { RightPanel } from "@/components/layout/right-panel"
import { Sidebar } from "@/components/layout/sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AuthRedirect />
      <Navbar />
      <main className="mx-auto max-w-240 px-4 py-6 pb-20 md:pb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_240px]">
          <aside className="hidden md:block">
            <Sidebar />
          </aside>
          <div className="min-w-0">{children}</div>
          <aside className="hidden lg:block">
            <RightPanel />
          </aside>
        </div>
      </main>
      <MobileTabBar />
    </div>
  )
}