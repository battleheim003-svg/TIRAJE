import { NextRequest, NextResponse } from "next/server"
import { db } from "@tirajeh/database"
import { releaseOrderStock } from "@/lib/stock"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 })
  }

  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let isValid = false
  try {
    const secretBuffer = Buffer.from(cronSecret)
    const tokenBuffer = Buffer.from(token)
    if (secretBuffer.length === tokenBuffer.length) {
      isValid = crypto.timingSafeEqual(secretBuffer, tokenBuffer)
    }
  } catch (e) {
    isValid = false
  }

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        await releaseOrderStock(tx as any, order.id)
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
