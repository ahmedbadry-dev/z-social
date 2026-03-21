import { Check } from "lucide-react"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper"

export default function CheckInboxPage() {
  return (
    <AuthLayoutWrapper>
      <AuthCard className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#22C55E]/15">
          <Check className="size-6 text-[#22C55E]" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Check your inbox!</h1>
        <p className="text-sm text-muted-foreground">
          Simply open your inbox and click the link to access your account. No
          passwords required!
        </p>
      </AuthCard>
    </AuthLayoutWrapper>
  )
}
