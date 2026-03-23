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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://z-social-rouge.vercel.app"

export const metadata: Metadata = {
  title: {
    default: "Z-Social — Connect with people",
    template: "%s | Z-Social",
  },
  description:
    "A modern social platform to share posts, connect with friends, and stay updated.",
  keywords: ["social", "network", "posts", "connect", "z-social"],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Z-Social — Connect with people",
    description: "A modern social platform to share posts, connect with friends, and stay updated.",
    type: "website",
    url: siteUrl,
    siteName: "Z-Social",
    images: [
      {
        url: `${siteUrl}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: "Z-Social logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Z-Social — Connect with people",
    description: "A modern social platform to share posts, connect with friends, and stay updated.",
    images: [`${siteUrl}/android-chrome-512x512.png`],
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
              <Toaster position="top-center" richColors />
            </NuqsAdapter>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
