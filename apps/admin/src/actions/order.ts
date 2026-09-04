"use server"

import { db } from "@tirajeh/database"
import { auth, requirePermission } from "@tirajeh/auth"
import { UpdateOrderStatusSchema } from "@tirajeh/shared"
import { PERMISSIONS } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "./_audit"

async function getSessionOrThrow() {
  const session = await auth()
  if (!session?.user) throw new Error("UNAUTHENTICATED")
  return session
}

export async function updateOrderStatusAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.ORDER_UPDATE)

  const parsed = UpdateOrderStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { orderId, status, note } = parsed.data

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  })
  if (!order) return { success: false, error: "سفارش یافت نشد" }

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status } }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        status,
        note: note ?? null,
        changedBy: session.user.id,
      },
    }),
  ])

  await writeAuditLog({
    userId: session.user.id,
    action: "status_change",
    resource: "order",
    resourceId: orderId,
    oldValues: { status: order.status },
    newValues: { status },
  })

  revalidatePath(`/orders/${orderId}`)
  revalidatePath("/orders")
  return { success: true, data: undefined }
}

export async function cancelOrderAction(orderId: string, reason: string): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.ORDER_CANCEL)

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  })
  if (!order) return { success: false, error: "سفارش یافت نشد" }
  if (["CANCELLED", "DELIVERED", "REFUNDED"].includes(order.status))
    return { success: false, error: "این سفارش قابل لغو نیست" }

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
    db.orderStatusHistory.create({
      data: { orderId, status: "CANCELLED", note: reason, changedBy: session.user.id },
    }),
  ])

  await writeAuditLog({
    userId: session.user.id,
    action: "cancel",
    resource: "order",
    resourceId: orderId,
    oldValues: { status: order.status },
    newValues: { status: "CANCELLED", reason },
  })

  revalidatePath("/orders")
  return { success: true, data: undefined }
}
