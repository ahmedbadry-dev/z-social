import { SocialLogo } from "@/components/auth/social-logo"

export function PageLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <SocialLogo />
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#3B55E6]" />
        </div>
        <p className="animate-pulse text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
