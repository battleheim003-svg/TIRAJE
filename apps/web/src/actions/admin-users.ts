"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"

export async function adminToggleUserStatusAction(userId: string, isActive: boolean): Promise<{ ok: true }> {
  await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  if (!userId) throw new Error("شناسه کاربر الزامی است")

  await db.user.update({
    where: { id: userId },
    data: { isActive },
  })

  revalidatePath("/admin/users")
  return { ok: true }
}

export async function adminDeleteUserAction(userId: string): Promise<{ ok: true }> {
  await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  if (!userId) throw new Error("شناسه کاربر الزامی است")

  await db.user.delete({
    where: { id: userId },
  })

  revalidatePath("/admin/users")
  return { ok: true }
}
