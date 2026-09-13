import { requirePerm } from "@tirajeh/auth"
import type { Session } from "next-auth"

export type AdminUser = NonNullable<Session["user"]>

export async function requireAdminPerm(
  permission: string | string[]
): Promise<AdminUser> {
  const session = await requirePerm(permission)
  return session.user
}
