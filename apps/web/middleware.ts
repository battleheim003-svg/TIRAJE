import { auth } from "@tirajeh/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"

const intlMiddleware = createIntlMiddleware({
  locales: ["fa", "en"],
  defaultLocale: "fa",
  localePrefix: "as-needed",
})

const PROTECTED_PREFIXES = ["/account", "/checkout", "/orders"]
const ADMIN_PREFIXES = ["/admin"]
const ADMIN_ROLES = ["admin", "super_admin"]

export default auth(async function middleware(req: NextRequest & { auth: unknown }) {
  const { pathname } = req.nextUrl
  const session = (req as any).auth

  // Run i18n middleware first
  const intlResponse = intlMiddleware(req)

  // Protect account/checkout routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) || pathname.startsWith(`/fa${prefix}`) || pathname.startsWith(`/en${prefix}`)
  )

  if (isProtected && !session) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect admin routes — require authenticated + admin role
  const isAdmin = ADMIN_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) || pathname.startsWith(`/fa${prefix}`) || pathname.startsWith(`/en${prefix}`)
  )

  if (isAdmin) {
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    const roleName: string | null | undefined = (session as any)?.user?.roleName
    if (!roleName || !ADMIN_ROLES.includes(roleName)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return intlResponse
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
