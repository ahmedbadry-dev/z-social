import { createAuthClient } from "better-auth/react"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { magicLinkClient, emailOTPClient } from "better-auth/client/plugins"

function getBaseURL(): string {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      ""
    )
  }

  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    window.location.origin
  )
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [convexClient(), magicLinkClient(), emailOTPClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
