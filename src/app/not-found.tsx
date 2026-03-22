import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SocialLogo } from "@/components/auth/social-logo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <SocialLogo />
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <span className="text-4xl font-black text-[#3B55E6]">404</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Page not found</h1>
          <p className="mt-1.5 max-w-[300px] text-sm text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
      </div>
      <Button asChild className="bg-[#3B55E6] text-white hover:bg-[#2D46D6]">
        <Link href="/feed">Go to Feed</Link>
      </Button>
    </div>
  )
}
