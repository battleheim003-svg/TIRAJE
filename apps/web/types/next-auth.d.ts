import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      roleName: string
      permissions: string[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    roleName: string
    permissions: string[]
    refreshedAt: number
    tokenVersion: number
  }
}
