import { createAuthClient } from "better-auth/react"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { magicLinkClient, emailOTPClient } from "better-auth/client/plugins"

const baseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : `https://${process.env.VERCEL_URL}`)

export const authClient = createAuthClient({
  baseURL: baseURL!,
  plugins: [convexClient(), magicLinkClient(), emailOTPClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
