import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@tirajeh/database"
import bcrypt from "bcryptjs"
import { LoginSchema, UnauthenticatedError, ForbiddenError } from "@tirajeh/shared"
import type { SessionUser } from "@tirajeh/shared"
import type { Session } from "next-auth"
import { handleJwtCallback, type AuthJWT, type AuthUser } from "./jwt-refresh"

export { handleJwtCallback } from "./jwt-refresh"
export type { AuthJWT, AuthUser } from "./jwt-refresh"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        })

        if (!user || !user.passwordHash) return null
        if (!user.isActive) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        const permissions =
          user.role?.rolePermissions.map(
            (rp) => `${rp.permission.resource}:${rp.permission.action}`
          ) ?? []

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null,
          customerType: user.customerType,
          roleId: user.roleId,
          roleName: user.role?.name ?? null,
          permissions,
          tokenVersion: user.tokenVersion,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      return handleJwtCallback({
        token: token as AuthJWT,
        user: user as AuthUser | undefined,
      })
    },
    async session({ session, token }) {
      const sessionUser: SessionUser = {
        id: (token.id as string) ?? "",
        email: (token.email as string) ?? "",
        name: (token.name as string) ?? null,
        image: (token.image as string) ?? null,
        customerType: (token.customerType ?? "NORMAL") as SessionUser["customerType"],
        roleId: (token.roleId as string) ?? null,
        roleName: (token.roleName as string) ?? null,
        permissions: (token.permissions as string[]) ?? [],
      }
      session.user = sessionUser as unknown as typeof session.user
      return session
    },
  },
})

/** Type-safe permission check for server components / server actions */
export function hasPermission(
  permissions: string[],
  required: string | string[]
): boolean {
  const required_ = Array.isArray(required) ? required : [required]
  return required_.every((p) => permissions.includes(p))
}

/** Guard for server actions — throws if permission missing */
export function requirePermission(
  permissions: string[],
  required: string | string[]
): void {
  if (!hasPermission(permissions, required)) {
    throw new Error("FORBIDDEN")
  }
}

// ─── requireAuth — throws UnauthenticatedError ───────────────────────────────
export async function requireAuth(): Promise<Session & { user: NonNullable<Session["user"]> }> {
  const session = await auth()
  if (!session?.user) throw new UnauthenticatedError()
  return session as Session & { user: NonNullable<Session["user"]> }
}

// ─── requirePerm — requireAuth + permission check ────────────────────────────
export async function requirePerm(
  permission: string | string[]
): Promise<Session & { user: NonNullable<Session["user"]> }> {
  const session = await requireAuth()
  const userPerms = (session.user as { permissions?: string[] }).permissions ?? []
  if (!hasPermission(userPerms, permission)) {
    throw new ForbiddenError()
  }
  return session
}
