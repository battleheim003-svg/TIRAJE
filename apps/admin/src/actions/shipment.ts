"use server"

import { db } from "@tirajeh/database"
import { auth, requirePermission } from "@tirajeh/auth"
import { UpdateShipmentSchema } from "@tirajeh/shared"
import { PERMISSIONS } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "./_audit"

async function getSessionOrThrow() {
  const session = await auth()
  if (!session?.user) throw new Error("UNAUTHENTICATED")
  return session
}

export async function updateShipmentAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.SHIPMENT_UPDATE)

  const parsed = UpdateShipmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { shipmentId, status, note, ...rest } = parsed.data

  const shipment = await db.shipment.findUnique({ where: { id: shipmentId } })
  if (!shipment) return { success: false, error: "ارسال یافت نشد" }

  await db.$transaction([
    db.shipment.update({
      where: { id: shipmentId },
      data: { status, ...rest },
    }),
    db.shipmentStatusHistory.create({
      data: {
        shipmentId,
        status,
        note: note ?? null,
        changedBy: session.user.id,
      },
    }),
  ])

  await writeAuditLog({
    userId: session.user.id,
    action: "status_change",
    resource: "shipment",
    resourceId: shipmentId,
    oldValues: { status: shipment.status },
    newValues: { status },
  })

  revalidatePath(`/shipments/${shipmentId}`)
  revalidatePath("/shipments")
  return { success: true, data: undefined }
}
