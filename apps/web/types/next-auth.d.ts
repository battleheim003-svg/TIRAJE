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

  interface User {
    customerType?: string
    roleId?: string | null
    roleName?: string | null
    permissions?: string[]
    tokenVersion?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    email?: string | null
    name?: string | null
    image?: string | null
    customerType?: string
    roleId?: string | null
    roleName?: string | null
    permissions?: string[]
    refreshedAt?: number
    tokenVersion?: number
  }
}
