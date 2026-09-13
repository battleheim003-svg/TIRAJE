import { db } from "@tirajeh/database"

export interface AuthUser {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
  customerType?: string
  roleId?: string | null
  roleName?: string | null
  permissions?: string[]
  tokenVersion?: number
}

export interface AuthJWT {
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
  [key: string]: unknown
}

export async function handleJwtCallback({
  token,
  user,
}: {
  token: AuthJWT
  user?: AuthUser | null
}): Promise<AuthJWT | null> {
  if (user) {
    // First sign-in: user object is from authorize()
    token.id = user.id
    token.email = user.email
    token.name = user.name
    token.image = user.image
    token.customerType = user.customerType
    token.roleId = user.roleId
    token.roleName = user.roleName
    token.permissions = user.permissions
    token.tokenVersion = user.tokenVersion ?? 0
    token.refreshedAt = Date.now()
    return token
  }

  if (!token.id) {
    return null
  }

  // Check refresh interval (5 minutes = 300,000 ms)
  const lastRefreshed = typeof token.refreshedAt === "number" ? token.refreshedAt : Date.now() - 6 * 60 * 1000
  const isStale = Date.now() - lastRefreshed > 5 * 60 * 1000

  if (!isStale) {
    return token
  }

  // Refresh user from DB
  const dbUser = await db.user.findUnique({
    where: { id: token.id },
    select: {
      id: true,
      isActive: true,
      tokenVersion: true,
      roleId: true,
      role: {
        select: {
          name: true,
          rolePermissions: {
            select: {
              permission: {
                select: {
                  resource: true,
                  action: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!dbUser || !dbUser.isActive) {
    return null
  }

  const currentTokenVersion = typeof token.tokenVersion === "number" ? token.tokenVersion : 0
  if (dbUser.tokenVersion !== currentTokenVersion) {
    return null
  }

  token.roleId = dbUser.roleId
  token.roleName = dbUser.role?.name ?? null
  token.permissions =
    dbUser.role?.rolePermissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`
    ) ?? []
  token.tokenVersion = dbUser.tokenVersion
  token.refreshedAt = Date.now()

  return token
}
