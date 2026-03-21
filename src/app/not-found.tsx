import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SocialLogo } from "@/components/auth/social-logo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <SocialLogo />
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
      <Button asChild>
        <Link href="/feed">Go to Feed</Link>
      </Button>
    </div>
  )
}
