import { Check } from "lucide-react"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper"

export default function CheckInboxPage() {
  return (
    <AuthLayoutWrapper>
      <AuthCard className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
          <Check className="size-6 text-green-700" />
        </div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Check your inbox!</h1>
        <p className="text-sm text-[#64748B]">
          Simply open your inbox and click the link to access your account. No
          passwords required!
        </p>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}
