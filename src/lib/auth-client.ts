import { createAuthClient } from "better-auth/react"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { magicLinkClient, emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [convexClient(), magicLinkClient(), emailOTPClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
