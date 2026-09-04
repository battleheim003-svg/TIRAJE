import { auth } from "@tirajeh/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/auth/login", "/auth/error"]

export default auth(function middleware(req: NextRequest & { auth: unknown }) {
  const { pathname } = req.nextUrl
  const session = (req as any).auth

  if (PUBLIC_PATHS.includes(pathname)) {
    if (session) return NextResponse.redirect(new URL("/", req.url))
    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Ensure the user has at least dashboard:read permission to enter admin
  const permissions: string[] = (session as any).user?.permissions ?? []
  if (!permissions.includes("dashboard:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
