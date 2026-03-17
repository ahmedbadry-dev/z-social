import { AuthRedirect } from "@/components/auth/auth-redirect"
import { MainContent } from "@/components/layout/main-content"
import { MobileTabBar } from "@/components/layout/mobile-tab-bar"
import { Navbar } from "@/components/layout/navbar"

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
        <MainContent>{children}</MainContent>
      </main>
      <MobileTabBar />
    </div>
  )
}
