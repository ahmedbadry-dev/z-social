import { Suspense } from "react"
import { SidebarWrapper } from "@/components/layout/sidebar-wrapper"
import { RightPanelWrapper } from "@/components/layout/right-panel-wrapper"
import { Skeleton } from "@/components/ui/skeleton"
import { preloadAuthQuery } from "@/lib/auth-server"
import { api } from "../../../../convex/_generated/api"

function RightPanelSkeleton() {
  return (
    <div className="rounded-lg bg-card p-4 shadow-sm">
      <Skeleton className="h-4 w-28" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUser)

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr] lg:grid-cols-[1fr_2fr_1fr]">
      <SidebarWrapper preloadedUser={preloadedUser} />
      <div className="min-w-0">{children}</div>
      <Suspense fallback={<RightPanelSkeleton />}>
        <RightPanelWrapper />
      </Suspense>
    </div>
  )
}
