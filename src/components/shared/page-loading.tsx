import { SocialLogo } from "@/components/auth/social-logo"

export function PageLoading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
            <SocialLogo />
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-[#3B55E6]" />
        </div>
    )
}
