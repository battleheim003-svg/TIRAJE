"use server"

import { db, OrderStatus } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { releaseOrderStock } from "@/lib/stock"
import { emailService, enqueue } from "@tirajeh/integrations"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS, canTransition, OUTBOX_EVENTS, OUTBOX_CHANNELS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"
import { z } from "zod"

export type UpdateOrderStatusResult =
  | { ok: true; success: true }
  | { ok?: false; success: false; error: string }

const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "شناسه سفارش الزامی است"),
  status: z.nativeEnum(OrderStatus, { errorMap: () => ({ message: "وضعیت نامعتبر" }) }),
  note: z.string().optional().nullable().transform((v) => v?.trim() || null),
})

export async function adminUpdateOrderStatusAction(
  formData: FormData
): Promise<UpdateOrderStatusResult> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.ORDERS_UPDATE)

  const raw = Object.fromEntries(formData.entries())
  const parsed = UpdateOrderStatusSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "داده‌های ورودی معتبر نیستند." }
  }
  const { orderId, status: newStatus, note } = parsed.data

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
      await releaseOrderStock(tx, orderId)
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        status: newStatus,
        note: note || "تغییر وضعیت توسط ادمین",
        createdBy: user.id,
      },
    })

    await enqueue(tx, {
      event: OUTBOX_EVENTS.ORDER_STATUS_CHANGED,
      channel: OUTBOX_CHANNELS.TG_ADMIN,
      payload: {
        orderId,
        orderNumber: order.orderNumber,
        from: order.status,
        to: newStatus,
        adminId: user.id,
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
