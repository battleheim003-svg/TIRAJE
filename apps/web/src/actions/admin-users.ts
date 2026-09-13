"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

export type UserActionResult =
  | { ok: true; success: true }
  | { ok?: false; success: false; error: string }

export async function adminToggleUserStatusAction(
  userId: string,
  isActive: boolean
): Promise<UserActionResult> {
  const user = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  if (!userId) throw new Error("شناسه کاربر الزامی است")

  if (userId === user.id) {
    return { success: false, error: "نمیتوانید حساب خود را غیرفعال کنید" }
  }

  await db.user.update({
    where: { id: userId },
    data: {
      isActive,
      tokenVersion: { increment: 1 },
    },
  })

  await audit({
    userId: user.id,
    action: "user.status_changed",
    resource: "User",
    resourceId: userId,
    after: { isActive },
  })

  revalidatePath("/admin/users")
  return { ok: true, success: true }
}

export async function adminDeleteUserAction(
  userId: string
): Promise<UserActionResult> {
  const user = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  if (!userId) throw new Error("شناسه کاربر الزامی است")

  if (userId === user.id) {
    return { success: false, error: "نمیتوانید حساب خود را حذف کنید" }
  }

  const superAdminCount = await db.user.count({
    where: { role: { name: "super_admin" }, isActive: true },
  })
  if (superAdminCount <= 1) {
    const target = await db.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })
    if (target?.role?.name === "super_admin") {
      return { success: false, error: "آخرین مدیر ارشد سیستم را نمیتوان حذف کرد" }
    }
  }

  await db.user.delete({
    where: { id: userId },
  })

  await audit({
    userId: user.id,
    action: "user.archive",
    resource: "User",
    resourceId: userId,
  })

  revalidatePath("/admin/users")
  return { ok: true, success: true }
}
