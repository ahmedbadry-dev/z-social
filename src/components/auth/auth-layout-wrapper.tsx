"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SocialLogo } from "@/components/auth/social-logo"

interface AuthLayoutWrapperProps {
  children: React.ReactNode
  showBack?: boolean
  onBack?: () => void
}

export function AuthLayoutWrapper({
  children,
  showBack = false,
  onBack,
}: AuthLayoutWrapperProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }

    router.back()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1128px] flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex w-full max-w-[400px] items-center justify-start">
        {showBack ? (
          <Button
            type="button"
            variant="ghost"
            className="h-auto px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Button>
        ) : (
          <div className="h-8" />
        )}
      </div>
      <div className="mb-6 flex justify-center">
        <SocialLogo />
      </div>
      {children}
    </div>
  )
}
