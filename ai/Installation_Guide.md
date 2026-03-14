# Social Platform — Official Installation Guide
## Every step follows the official documentation exactly

> ⚠️ Follow steps IN ORDER. Do not skip or reorder.
> Each tool must be set up before the next one is installed.

---

## Prerequisites
- Node.js **18.17+** installed → check with `node -v`
- A **GitHub** account (needed for Convex login)
- A **Google Cloud** account (for OAuth)
- An **Uploadthing** account → https://uploadthing.com
- A **Resend** account → https://resend.com

---

## STEP 1 — Create the Next.js App

Run this and answer the prompts exactly as shown:

```bash
npx create-next-app@latest social-platform
```

Answer the prompts:
```
✔ Would you like to use TypeScript?                    YES
✔ Would you like to use ESLint?                        YES
✔ Would you like to use Tailwind CSS?                  YES
✔ Would you like your code inside a `src/` directory?  YES
✔ Would you like to use App Router? (recommended)      YES
✔ Would you like to use Turbopack for next dev?        NO   ← important: NO
✔ Would you like to customize the import alias?        YES
✔ What import alias would you like configured?         @/*  (press Enter)
```

Then enter the project:
```bash
cd social-platform
```

---

## STEP 2 — Install shadcn/ui
**Source: https://ui.shadcn.com/docs/installation/next**

```bash
npx shadcn@latest init
```

Answer the prompts:
```
✔ Which style would you like to use?    New York
✔ Which color would you like to use?    Neutral
✔ Would you like to use CSS variables?  YES
```

This will:
- Create `components.json`
- Update `src/app/globals.css` with shadcn CSS variables
- Create `src/lib/utils.ts` with the `cn()` helper
- Configure Tailwind with the shadcn preset

Now install all the shadcn components you need:
```bash
npx shadcn@latest add button input textarea avatar card badge dialog alert-dialog dropdown-menu tabs separator label checkbox sonner skeleton sheet scroll-area tooltip popover form toggle progress input-otp
```

> ✅ Note: shadcn with Tailwind v4 is fully supported as of 2025.
> The CLI handles all configuration automatically.
> Do NOT manually edit `globals.css` Tailwind config — the CLI manages it.

---

## STEP 3 — Install Convex
**Source: https://docs.convex.dev/quickstart/nextjs**

```bash
npm install convex
```

Now initialize Convex (this requires you to log in with GitHub):
```bash
npx convex dev
```

This will:
- Open a browser to log in with GitHub
- Ask you to create or select a project
- Create the `convex/` folder in your project root
- Add `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to your `.env.local`
- Start watching your `convex/` folder for changes

**Keep this terminal running.** Open a second terminal for all other commands.

Now create the Convex client provider.

Create `src/components/convex-client-provider.tsx`:
```tsx
"use client"

import { ConvexReactClient } from "convex/react"
import { ReactNode } from "react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}
```

---

## STEP 4 — Install Better Auth
**Source: https://better-auth.com/docs/installation**

```bash
npm install better-auth
```

Add environment variables to `.env.local`:
```env
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your_generated_secret_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

Create `src/lib/auth.ts`:
```ts
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(), // ← must be last plugin in array
  ],
})
```

Create `src/lib/auth-client.ts`:
```ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
})

export const { signIn, signUp, signOut, useSession } = authClient
```

Create the API route `src/app/api/auth/[...all]/route.ts`:
```ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

> ✅ Better Auth stores session data. Since we're using Convex as our database,
> we'll configure the Better Auth + Convex integration in Phase 2 of the build prompts.

---

## STEP 5 — Install Uploadthing
**Source: https://docs.uploadthing.com/getting-started/appdir**

```bash
npm install uploadthing @uploadthing/react
```

Add environment variable to `.env.local`:
```env
UPLOADTHING_TOKEN=your_token_from_dashboard
```

> Get your token from: https://uploadthing.com/dashboard → API Keys

Create the file router `src/app/api/uploadthing/core.ts`:
```ts
import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

export const ourFileRouter = {
  postMedia: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // Will be replaced with real auth check in Phase 2
      return { userId: "placeholder" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl }
    }),

  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      return { userId: "placeholder" }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
```

Create the API route `src/app/api/uploadthing/route.ts`:
```ts
import { createRouteHandler } from "uploadthing/next"
import { ourFileRouter } from "./core"

export const { GET, POST } = createRouteHandler({ router: ourFileRouter })
```

Create the typed helpers `src/lib/uploadthing.ts`:
```ts
import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()
```

Add the SSR plugin to your root layout `src/app/layout.tsx`:
```tsx
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { ourFileRouter } from "@/app/api/uploadthing/core"

// Add inside <body> BEFORE {children}:
<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
```

---

## STEP 6 — Install Resend
**Source: https://resend.com/docs/send-with-nextjs**

```bash
npm install resend
```

Add environment variable to `.env.local`:
```env
RESEND_API_KEY=your_api_key_from_resend
EMAIL_FROM=noreply@yourdomain.com
```

> Get your API key from: https://resend.com/api-keys

Create `src/lib/resend.ts`:
```ts
import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY!)
```

---

## STEP 7 — Install Zustand
**Source: https://zustand.docs.pmnd.rs/getting-started/introduction**

```bash
npm install zustand
```

No configuration needed. Zustand stores will be created as needed during the build phases.

---

## STEP 8 — Install nuqs
**Source: https://nuqs.47ng.com / https://github.com/47ng/nuqs**

```bash
npm install nuqs
```

Add the adapter to your root layout `src/app/layout.tsx`:
```tsx
import { NuqsAdapter } from "nuqs/adapters/next/app"

// Wrap children with NuqsAdapter inside <body>:
<NuqsAdapter>
  {children}
</NuqsAdapter>
```

> ✅ Use `nuqs/adapters/next/app` specifically for App Router.
> Do NOT use `nuqs/adapters/next` (unified) — it has known issues with Next.js App Router.

---

## STEP 9 — Install remaining utility packages

```bash
npm install \
  react-hook-form \
  @hookform/resolvers \
  zod \
  date-fns \
  lucide-react \
  clsx \
  tailwind-merge
```

---

## STEP 10 — Install dev dependencies

```bash
npm install -D \
  prettier \
  prettier-plugin-tailwindcss
```

Create `.prettierrc` in the project root:
```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## STEP 11 — Final root layout setup

Replace `src/app/layout.tsx` with the complete providers setup:

```tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { ourFileRouter } from "@/app/api/uploadthing/core"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Social",
  description: "A modern social platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ConvexClientProvider>
          <NuqsAdapter>
            {children}
            <Toaster position="bottom-right" richColors />
          </NuqsAdapter>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
```

---

## STEP 12 — Verify everything works

In **Terminal 1** (keep running):
```bash
npx convex dev
```

In **Terminal 2**:
```bash
npm run dev
```

Open http://localhost:3000 — you should see the default Next.js page with no errors.

---

## Complete `.env.local`

Your final `.env.local` should look like this:

```env
# ── Convex (auto-filled by npx convex dev) ──────────
CONVEX_DEPLOYMENT=dev:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# ── Better Auth ──────────────────────────────────────
# Generate: openssl rand -base64 32
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# ── Google OAuth ─────────────────────────────────────
# Get from: https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Uploadthing ──────────────────────────────────────
# Get from: https://uploadthing.com/dashboard → API Keys
UPLOADTHING_TOKEN=

# ── Resend ───────────────────────────────────────────
# Get from: https://resend.com/api-keys
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com
```

---

## Installation Order Summary

| Step | Package | Command |
|------|---------|---------|
| 1 | Next.js 15 | `npx create-next-app@latest` |
| 2 | shadcn/ui + Tailwind v4 | `npx shadcn@latest init` |
| 3 | Convex | `npm install convex` + `npx convex dev` |
| 4 | Better Auth | `npm install better-auth` |
| 5 | Uploadthing | `npm install uploadthing @uploadthing/react` |
| 6 | Resend | `npm install resend` |
| 7 | Zustand | `npm install zustand` |
| 8 | nuqs | `npm install nuqs` |
| 9 | Forms + utils | `npm install react-hook-form @hookform/resolvers zod date-fns lucide-react clsx tailwind-merge` |
| 10 | Dev tools | `npm install -D prettier prettier-plugin-tailwindcss` |

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `NEXT_PUBLIC_CONVEX_URL is not defined` | Convex dev not running | Run `npx convex dev` in a separate terminal |
| `nuqs requires an adapter` | Wrong adapter import | Use `nuqs/adapters/next/app` NOT `nuqs/adapters/next` |
| `UPLOADTHING_TOKEN is not set` | Missing env var | Add `UPLOADTHING_TOKEN` from Uploadthing dashboard |
| shadcn components not styled | globals.css not imported in layout | Ensure `import "./globals.css"` is in `layout.tsx` |
| Better Auth 401 on API routes | Missing route handler | Create `app/api/auth/[...all]/route.ts` |
| `tailwindcss-animate` deprecation warning | Old shadcn config | shadcn now uses `tw-animate-css` — let the CLI manage it |

---

*Installation guide based on official docs as of March 2026*
*Sources: docs.convex.dev · better-auth.com/docs · docs.uploadthing.com · ui.shadcn.com · nuqs.47ng.com*
