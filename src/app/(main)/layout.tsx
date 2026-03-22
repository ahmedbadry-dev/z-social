import { AuthRedirect } from "@/components/auth/auth-redirect"
import { MobileTabBar } from "@/components/layout/mobile-tab-bar"
import { Navbar } from "@/components/layout/navbar"
import { HydrationProvider } from "@/components/providers/hydration-provider"
import { preloadAuthQuery } from "@/lib/auth-server"
import { api } from "../../../convex/_generated/api"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUser)

  return (
    <div className="min-h-screen bg-background">
      <AuthRedirect />
      <Navbar preloadedUser={preloadedUser} />
      <HydrationProvider />
      <main className="mx-auto max-w-[1128px] px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
