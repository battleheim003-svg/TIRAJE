"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { revalidatePath } from "next/cache"

const ADMIN_ROLES = ["admin", "super_admin"]

async function requireAdmin() {
  const session = await auth()
  const roleName = (session?.user as any)?.roleName as string | undefined
  if (!session?.user || !roleName || !ADMIN_ROLES.includes(roleName)) {
    throw new Error("Unauthorized")
  }
  return session.user as any
}

import { releaseOrderStock, PrismaTx } from "../lib/stock"

export async function adminUpdateOrderStatusAction(
  formData: FormData
): Promise<{ ok: true }> {
  const admin = await requireAdmin()

  const orderId = (formData.get("orderId") as string | null)?.trim()
  const status = (formData.get("status") as string | null)?.trim()
  const note = (formData.get("note") as string | null)?.trim() || null

  if (!orderId || !status) throw new Error("Missing required fields")

  const order = await db.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order) throw new Error("Order not found")

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: status as any, adminNote: note ?? undefined },
    })

    if (status === "CANCELLED" || status === "REFUNDED") {
      await releaseOrderStock(tx as PrismaTx, orderId)
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        status: status as any,
        note: note || "تغییر وضعیت توسط ادمین",
        createdBy: admin.id,
      },
    })
  })

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
  return { ok: true }
}
