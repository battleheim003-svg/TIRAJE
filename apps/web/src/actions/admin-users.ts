"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

import { z } from "zod"

export type UserActionResult =
  | { ok: true; success: true }
  | { ok?: false; success: false; error: string }

const UserIdSchema = z.string().min(1, "شناسه کاربر الزامی است")

export async function adminToggleUserStatusAction(
  userId: string,
  isActive: boolean
): Promise<UserActionResult> {
  const user = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  const parsedId = UserIdSchema.safeParse(userId)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? "شناسه کاربر الزامی است" }
  }
  const validUserId = parsedId.data

  if (validUserId === user.id) {
    return { success: false, error: "نمیتوانید حساب خود را غیرفعال کنید" }
  }

  await db.user.update({
    where: { id: validUserId },
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
  const parsedId = UserIdSchema.safeParse(userId)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? "شناسه کاربر الزامی است" }
  }
  const validUserId = parsedId.data

  if (validUserId === user.id) {
    return { success: false, error: "نمیتوانید حساب خود را حذف کنید" }
  }

  const superAdminCount = await db.user.count({
    where: { role: { name: "super_admin" }, isActive: true },
  })
  if (superAdminCount <= 1) {
    const target = await db.user.findUnique({
      where: { id: validUserId },
      include: { role: true },
    })
    if (target?.role?.name === "super_admin") {
      return { success: false, error: "آخرین مدیر ارشد سیستم را نمیتوان حذف کرد" }
    }
  }

  await db.user.update({
    where: { id: validUserId },
    data: {
      archivedAt: new Date(),
      isActive: false,
      tokenVersion: { increment: 1 },
    },
  })

  await audit({
    userId: user.id,
    action: "user.archive",
    resource: "User",
    resourceId: validUserId,
  })

  revalidatePath("/admin/users")
  return { ok: true, success: true }
}

export async function adminRestoreUserAction(
  userId: string
): Promise<UserActionResult> {
  const user = await requireAdminPerm(PERMISSIONS.USERS_UPDATE)
  const parsedId = UserIdSchema.safeParse(userId)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message ?? "شناسه کاربر الزامی است" }
  }
  const validUserId = parsedId.data

  await db.user.update({
    where: { id: validUserId },
    data: { archivedAt: null, isActive: true },
  })

  await audit({
    userId: user.id,
    action: "user.restore",
    resource: "User",
    resourceId: validUserId,
  })

  revalidatePath("/admin/users")
  return { ok: true, success: true }
}
