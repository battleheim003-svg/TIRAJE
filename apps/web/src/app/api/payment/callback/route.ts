import { NextRequest, NextResponse } from "next/server"
import { paymentService, notifyNewOrder, notifyPaymentReceived, emailService } from "@tirajeh/integrations"
import { db } from "@tirajeh/database"
import { releaseOrderStock, PrismaTx } from "../../../../lib/stock"
import { getLocale } from "next-intl/server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const Authority = searchParams.get("Authority") ?? ""
  const Status = searchParams.get("Status") ?? ""
  const orderId = searchParams.get("orderId") ?? ""

  // When we use next-intl inside API routes we might need the current locale,
  // but if getLocale doesn't work well outside of `app/[locale]` tree,
  // we can fallback to a default locale "fa"
  let locale = "fa"
  try {
    locale = await getLocale()
  } catch (e) {
    locale = "fa"
  }

  if (Status !== "OK") {
    // کاربر پرداخت را لغو کرد
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } })
      await releaseOrderStock(tx as PrismaTx, orderId)
      await tx.orderEvent.create({ data: { orderId, status: "CANCELLED", note: "لغو پرداخت توسط کاربر" } })
    })
    return NextResponse.redirect(new URL(`/${locale}/checkout/failed?order=${orderId}`, req.url))
  }

  const verifyResult = await paymentService.verifyPayment(Authority)

  if (!verifyResult.success) {
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } })
      await releaseOrderStock(tx as PrismaTx, orderId)
    })
    return NextResponse.redirect(new URL(`/${locale}/checkout/failed?order=${orderId}`, req.url))
  }

  // بیرون از $transaction — بعد از commit موفق
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { nameFa: true } } } },
    },
  })

  if (order) {
    const shippingAddr = (order.shippingAddress as Record<string, any>) || {}
    const customerName = order.user?.name || shippingAddr.recipientName || "مشتری"
    const city = shippingAddr.city || order.shippingProvince || "نامشخص"

    try {
      await notifyNewOrder({
        orderNumber: String(order.orderNumber),
        customerName,
        totalAmount: Number(order.totalAmount),
        itemCount: order.items.length,
        city,
      })
    } catch (e) {
      console.error("[notify] telegram order:", e)
    }

    try {
      await notifyPaymentReceived({
        orderNumber: String(order.orderNumber),
        amount: Number(order.totalAmount),
        refId: String(verifyResult.refId ?? ""),
      })
    } catch (e) {
      console.error("[notify] telegram payment:", e)
    }

    if (order.user?.email) {
      try {
        await emailService.sendOrderConfirmation({
          to: order.user.email,
          orderNumber: String(order.orderNumber),
          customerName,
          items: order.items.map((it) => ({
            nameFa: it.product.nameFa,
            quantity: it.quantity,
            unitPriceToman: Number(it.unitPrice),
          })),
          subtotalToman: Number(order.subtotal),
          shippingToman: Number(order.shippingCost),
          totalToman: Number(order.totalAmount),
          status: order.status,
        })
      } catch (e) {
        console.error("[notify] email confirm:", e)
      }
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/checkout/success?order=${verifyResult.orderId}`, req.url))
}
