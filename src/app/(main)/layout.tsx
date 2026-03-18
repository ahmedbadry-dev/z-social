import { AuthRedirect } from "@/components/auth/auth-redirect"
import { MobileTabBar } from "@/components/layout/mobile-tab-bar"
import { Navbar } from "@/components/layout/navbar"
import { HydrationProvider } from "@/components/providers/hydration-provider"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AuthRedirect />
      <Navbar />
      <HydrationProvider />
      <main className="mx-auto max-w-[960px] px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
