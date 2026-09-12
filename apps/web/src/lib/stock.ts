import { db } from "@tirajeh/database"
import type { Prisma } from "@tirajeh/database"

type PrismaTx = Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

/**
 * موجودی همه OrderItemهای یک سفارش را برمیگرداند.
 * Idempotent: اگر stockReleasedAt پر بود هیچکاری نمیکند.
 */
export async function releaseOrderStock(tx: PrismaTx, orderId: string): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { stockReleasedAt: true, items: { select: { productId: true, quantity: true } } },
  })
  if (!order || order.stockReleasedAt) return

  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQty: { increment: item.quantity } },
    })
  }

  await tx.order.update({
    where: { id: orderId },
    data: { stockReleasedAt: new Date() },
  })
}
