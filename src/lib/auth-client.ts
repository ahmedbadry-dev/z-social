import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { magicLinkClient, emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
  plugins: [convexClient(), magicLinkClient(), emailOTPClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
