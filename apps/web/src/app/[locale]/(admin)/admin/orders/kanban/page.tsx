import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { db } from "@tirajeh/database"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { KanbanBoard, KanbanCard } from "@/components/admin/KanbanBoard"

export const metadata: Metadata = {
  title: "برد کانبان سفارش‌ها | پنل مدیریت تیراژه",
}

export default async function AdminOrdersKanbanPage() {
  await requireAdminPerm(PERMISSIONS.ORDERS_UPDATE)
  const locale = await getLocale()

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  const [orders, cancelledCount, refundedCount] = await Promise.all([
    db.order.findMany({
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        createdAt: { gte: sixtyDaysAgo },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        shippingTruckType: true,
        shippingProvince: true,
        createdAt: true,
        items: {
          select: { quantity: true, weightKg: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.order.count({
      where: { status: "CANCELLED" },
    }),
    db.order.count({
      where: { status: "REFUNDED" },
    }),
  ])

  const initialCards: KanbanCard[] = orders.map((order) => {
    const totalWeightTon =
      order.items.reduce((s, i) => s + Number(i.weightKg ?? 0) * i.quantity, 0) /
      1000

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      shippingTruckType: order.shippingTruckType ? String(order.shippingTruckType) : null,
      shippingProvince: order.shippingProvince,
      totalWeightTon,
      createdAt: order.createdAt.toISOString(),
    }
  })

  return (
    <KanbanBoard
      initialCards={initialCards}
      terminalCounts={{
        CANCELLED: cancelledCount,
        REFUNDED: refundedCount,
      }}
      locale={locale}
    />
  )
}
