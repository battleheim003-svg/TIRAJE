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

const UpdateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export async function updateSettingAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.SETTING_UPDATE)

  const parsed = UpdateSettingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: "اطلاعات نامعتبر" }

  const existing = await db.setting.findUnique({ where: { key: parsed.data.key } })
  if (!existing) return { success: false, error: "تنظیم یافت نشد" }

  await db.setting.update({
    where: { key: parsed.data.key },
    data: { value: parsed.data.value },
  })

  await writeAuditLog({
    userId: session.user.id,
    action: "update",
    resource: "setting",
    resourceId: parsed.data.key,
    oldValues: { value: existing.value },
    newValues: { value: parsed.data.value },
  })

  revalidatePath("/settings")
  return { success: true, data: undefined }
}

export async function bulkUpdateSettingsAction(
  settings: Record<string, string>
): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.SETTING_UPDATE)

  await db.$transaction(
    Object.entries(settings).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  await writeAuditLog({
    userId: session.user.id,
    action: "update",
    resource: "setting",
    newValues: settings,
  })

  revalidatePath("/settings")
  return { success: true, data: undefined }
}
