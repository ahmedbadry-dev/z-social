"use client"

import { Button } from "@/components/ui/button"
import { SocialLogo } from "@/components/auth/social-logo"

export default function Error({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <SocialLogo />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
