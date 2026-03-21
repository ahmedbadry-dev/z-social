"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { authClient } from "@/lib/auth-client"
import { otpSchema } from "@/lib/validations"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const [otp, setOtp] = useState("")
  const [seconds, setSeconds] = useState(45)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (seconds === 0) {
      return
    }

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [seconds])

  useEffect(() => {
    if (!email || seconds !== 45) {
      return
    }

    // OTP is already sent during signup; no auto-resend on first load.
  }, [])

  if (!email) {
    return (
      <AuthLayoutWrapper>
        <AuthCard className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Missing email. Please{" "}
            <Link href="/signup" className="text-[#3B55E6] hover:underline">
              sign up again
            </Link>
          </p>
        </AuthCard>
      </AuthLayoutWrapper>
    )
  }

  const handleVerify = async () => {
    if (!email) {
      toast.error("Missing email in verification link")
      return
    }

    const validation = otpSchema.safeParse({ otp })
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Invalid code")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await authClient.$fetch("/email-otp/verify-email", {
        method: "POST",
        body: {
          email,
          otp,
        },
      })

      if (result?.error) {
        toast.error(result.error.message ?? "Invalid verification code")
        return
      }

      router.push("/feed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email || seconds > 0) {
      return
    }

    setIsResending(true)
    try {
      const result = await authClient.$fetch("/email-otp/send-verification-otp", {
        method: "POST",
        body: {
          email,
          type: "email-verification",
        },
      })

      if (result?.error) {
        toast.error(result.error.message ?? "Could not resend code")
        return
      }

      setSeconds(45)
      toast.success("Verification code sent")
    } finally {
      setIsResending(false)
    }
  }

  const timerText = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <AuthLayoutWrapper>
      <AuthCard className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0F172A]">Enter verification code</h1>
          <p className="text-sm text-[#64748B]">Code sent to {email || "your email"}</p>
        </div>
        <div className="space-y-4">
          <InputOTP
            maxLength={4}
            value={otp}
            onChange={setOtp}
            containerClassName="w-full justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="size-11 text-base" />
              <InputOTPSlot index={1} className="size-11 text-base" />
              <InputOTPSlot index={2} className="size-11 text-base" />
              <InputOTPSlot index={3} className="size-11 text-base" />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-center text-sm text-[#64748B]">
            Resend in{" "}
            {seconds > 0 ? (
              <span className="font-semibold text-[#0F172A]">{timerText}</span>
            ) : (
              <button
                type="button"
                className="font-semibold text-[#3B55E6] hover:underline disabled:opacity-60"
                disabled={isResending}
                onClick={handleResend}
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            )}
          </p>
          <Button
            type="button"
            disabled={isSubmitting || otp.length !== 4}
            className="h-11 w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
            onClick={handleVerify}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
          </Button>
        </div>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}
