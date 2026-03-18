import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SocialLogo } from "@/components/auth/social-logo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F3F4F6]">
      <SocialLogo />
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#0F172A]">404</h1>
        <p className="mt-2 text-lg text-[#64748B]">Page not found</p>
        <p className="mt-1 text-sm text-[#94A3B8]">
          The page you are looking for does not exist.
        </p>
      </div>
      <Button asChild>
        <Link href="/feed">Go to Feed</Link>
      </Button>
    </div>
  )
}
