"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { revalidatePath } from "next/cache"

const ADMIN_ROLES = ["admin", "super_admin"]

async function requireAdmin() {
  const session = await auth()
  const roleName = (session?.user as any)?.roleName as string | undefined
  if (!session?.user || !roleName || !ADMIN_ROLES.includes(roleName)) {
    throw new Error("Unauthorized")
  }
  return session.user as any
}

export async function adminToggleUserStatusAction(userId: string, isActive: boolean): Promise<{ ok: true }> {
  await requireAdmin()
  if (!userId) throw new Error("شناسه کاربر الزامی است")

  await db.user.update({
    where: { id: userId },
    data: { isActive },
  })

  revalidatePath("/admin/users")
  return { ok: true }
}

export async function adminDeleteUserAction(userId: string): Promise<{ ok: true }> {
  await requireAdmin()
  if (!userId) throw new Error("شناسه کاربر الزامی است")

  await db.user.delete({
    where: { id: userId },
  })

  revalidatePath("/admin/users")
  return { ok: true }
}
