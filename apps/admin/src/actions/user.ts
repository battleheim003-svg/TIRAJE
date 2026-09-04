"use server"

import { db } from "@tirajeh/database"
import { auth, requirePermission } from "@tirajeh/auth"
import { PERMISSIONS } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "./_audit"
import { z } from "zod"

async function getSessionOrThrow() {
  const session = await auth()
  if (!session?.user) throw new Error("UNAUTHENTICATED")
  return session
}

const UpdateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  customerType: z.enum(["NORMAL", "CONTRACTOR", "COMPANY"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]).optional(),
  roleId: z.string().uuid().optional().nullable(),
})

export async function updateUserAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.USER_UPDATE)

  const parsed = UpdateUserSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { userId, ...data } = parsed.data

  const existing = await db.user.findUnique({ where: { id: userId }, select: { status: true, customerType: true, roleId: true } })
  if (!existing) return { success: false, error: "کاربر یافت نشد" }

  await db.user.update({ where: { id: userId }, data })

  await writeAuditLog({
    userId: session.user.id,
    action: "update",
    resource: "user",
    resourceId: userId,
    oldValues: existing,
    newValues: data,
  })

  revalidatePath("/users")
  return { success: true, data: undefined }
}

export async function banUserAction(userId: string, reason: string): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.USER_UPDATE)

  // Prevent self-ban
  if (userId === session.user.id) return { success: false, error: "نمی‌توانید خود را مسدود کنید" }

  await db.user.update({ where: { id: userId }, data: { status: "BANNED" } })

  await writeAuditLog({
    userId: session.user.id,
    action: "update",
    resource: "user",
    resourceId: userId,
    newValues: { status: "BANNED", reason },
  })

  revalidatePath("/users")
  return { success: true, data: undefined }
}
