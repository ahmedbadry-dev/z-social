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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F3F4F6]">
      <SocialLogo />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0F172A]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
