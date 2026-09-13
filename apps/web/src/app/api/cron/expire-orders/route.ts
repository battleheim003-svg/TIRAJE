import { NextRequest, NextResponse } from "next/server"
import { db } from "@tirajeh/database"
import { releaseOrderStock, PrismaTx } from "@/lib/stock"
import { verifyCronSecret, cronUnauthorizedResponse } from "@/lib/cron-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return cronUnauthorizedResponse()
  }

  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)

  const abandonedOrders = await db.order.findMany({
    where: {
      status: "AWAITING_PAYMENT",
      createdAt: { lt: thirtyMinsAgo },
    },
    select: { id: true },
  })

  let expired = 0

  for (const order of abandonedOrders) {
    try {
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        })
        await releaseOrderStock(tx as PrismaTx, order.id)
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            status: "CANCELLED",
            note: "انقضای مهلت پرداخت",
          },
        })
      })
      expired++
    } catch (e) {
      console.error(`Failed to expire order ${order.id}`, e)
    }
  }

  return NextResponse.json({ expired })
}
