"use server"

import { db, OrderStatus } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { releaseOrderStock, PrismaTx } from "@/lib/stock"
import { emailService } from "@tirajeh/integrations"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS, canTransition } from "@tirajeh/shared"
import { audit } from "@/lib/audit"
import { z } from "zod"

export type UpdateOrderStatusResult =
  | { ok: true; success: true }
  | { ok?: false; success: false; error: string }

export async function adminUpdateOrderStatusAction(
  formData: FormData
): Promise<UpdateOrderStatusResult> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.ORDERS_UPDATE)

  const orderId = (formData.get("orderId") as string | null)?.trim()
  const rawStatus = (formData.get("status") as string | null)?.trim()
  const note = (formData.get("note") as string | null)?.trim() || null

  if (!orderId || !rawStatus) {
    return { success: false, error: "شناسه سفارش و وضعیت الزامی است" }
  }

  const parsed = z.nativeEnum(OrderStatus).safeParse(rawStatus)
  if (!parsed.success) {
    return { success: false, error: "وضعیت نامعتبر" }
  }
  const newStatus = parsed.data

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!order) {
    return { success: false, error: "سفارش یافت نشد" }
  }

  if (!canTransition(order.status, newStatus)) {
    return {
      success: false,
      error: `گذار از ${order.status} به ${newStatus} مجاز نیست`,
    }
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus, adminNote: note ?? undefined },
    })

    if (newStatus === "CANCELLED" || newStatus === "REFUNDED") {
      await releaseOrderStock(tx as unknown as PrismaTx, orderId)
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        status: newStatus,
        note: note || "تغییر وضعیت توسط ادمین",
        createdBy: user.id,
      },
    })
  })

  try {
    await audit({
      userId: user.id,
      action: "order.status_changed",
      resource: "Order",
      resourceId: orderId,
      before: { status: order.status },
      after: { status: newStatus },
    })
  } catch (e) {
    console.error("[audit] status change:", e)
  }

  if (order.user?.email) {
    try {
      await emailService.sendOrderStatusUpdate({
        customerName: order.user.name ?? "",
        customerEmail: order.user.email,
        orderNumber: String(order.orderNumber),
        newStatus,
        note: note ?? undefined,
      })
    } catch (e) {
      console.error("[notify] status email:", e)
    }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
  return { ok: true, success: true }
}
