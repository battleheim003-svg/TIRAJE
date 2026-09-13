"use server"

import { db, OrderStatus } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { releaseOrderStock, PrismaTx } from "../lib/stock"
import { emailService } from "@tirajeh/integrations"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

export async function adminUpdateOrderStatusAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.ORDERS_UPDATE)

  const orderId = (formData.get("orderId") as string | null)?.trim()
  const status = (formData.get("status") as string | null)?.trim()
  const note = (formData.get("note") as string | null)?.trim() || null

  if (!orderId || !status) throw new Error("Missing required fields")

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!order) throw new Error("Order not found")

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus, adminNote: note ?? undefined },
    })

    if (status === "CANCELLED" || status === "REFUNDED") {
      await releaseOrderStock(tx as PrismaTx, orderId)
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        status: status as OrderStatus,
        note: note || "تغییر وضعیت توسط ادمین",
        createdBy: user.id,
      },
    })
  })

  await audit({
    userId: user.id,
    action: "order.status_changed",
    resource: "Order",
    resourceId: orderId,
    before: { status: order.status },
    after: { status },
  })

  if (order.user?.email) {
    try {
      await emailService.sendOrderStatusUpdate({
        customerName: order.user.name ?? "",
        customerEmail: order.user.email,
        orderNumber: String(order.orderNumber),
        newStatus: status,
        note: note ?? undefined,
      })
    } catch (e) {
      console.error("[notify] status email:", e)
    }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
  return { ok: true }
}
