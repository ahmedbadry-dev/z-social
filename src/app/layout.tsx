import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { extractRouterConfig } from "uploadthing/server"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ourFileRouter } from "@/app/api/uploadthing/core"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { getToken } from "@/lib/auth-server"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Social — Connect with people",
    template: "%s | Social",
  },
  description:
    "A modern social platform to share posts, connect with friends, and stay updated.",
  keywords: ["social", "network", "posts", "connect"],
  openGraph: {
    title: "Social",
    description: "A modern social platform",
    type: "website",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialToken = await getToken()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <ConvexClientProvider initialToken={initialToken}>
            <NuqsAdapter>
              {children}
              <Toaster position="bottom-right" richColors />
            </NuqsAdapter>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
