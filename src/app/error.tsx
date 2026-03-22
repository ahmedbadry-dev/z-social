"use client"

import { Button } from "@/components/ui/button"
import { SocialLogo } from "@/components/auth/social-logo"
import { AlertTriangle } from "lucide-react"

export default function Error({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <SocialLogo />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-1.5 max-w-[300px] text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
        </div>
      </div>
      <Button
        onClick={reset}
        className="bg-[#3B55E6] text-white hover:bg-[#2D46D6]"
      >
        Try again
      </Button>
    </div>
  )
}
