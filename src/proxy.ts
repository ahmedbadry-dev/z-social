import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/login-with-email",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  "/check-inbox",
  "/api/auth",
  "/api/uploadthing",
  "/_next",
  "/favicon.ico",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const token =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value

  // Unauthenticated user trying to access a protected route
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Authenticated user trying to access an auth page
  if (isPublic && token && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/feed", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
