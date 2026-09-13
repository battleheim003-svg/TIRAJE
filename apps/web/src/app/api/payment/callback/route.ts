import { NextRequest, NextResponse } from "next/server"
import { paymentService, enqueue } from "@tirajeh/integrations"
import { db } from "@tirajeh/database"
import { OUTBOX_EVENTS, OUTBOX_CHANNELS } from "@tirajeh/shared"
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

  // بررسی وضعیت پرداخت و ثبت تراکنش Outbox در صورت نیاز
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: { select: { nameFa: true } } } },
      payments: { where: { status: "COMPLETED" } },
    },
  })

  if (order) {
    const shippingAddr = (order.shippingAddress as Record<string, any>) || {}
    const customerName = order.user?.name || shippingAddr.recipientName || "مشتری"
    const city = shippingAddr.city || order.shippingProvince || "نامشخص"

    // بررسی اینکه آیا قبلاً این رویداد در outbox ثبت شده یا خیر (idempotent)
    const existingOutbox = await db.outbox.findFirst({
      where: {
        event: OUTBOX_EVENTS.ORDER_PAID,
        channel: OUTBOX_CHANNELS.TG_ADMIN,
        payload: {
          path: ["orderId"],
          equals: orderId,
        },
      },
    })

    if (!existingOutbox) {
      await db.$transaction(async (tx) => {
        // ۱. تلگرام ادمین: پرداخت موفق
        await enqueue(tx, {
          event: OUTBOX_EVENTS.ORDER_PAID,
          channel: OUTBOX_CHANNELS.TG_ADMIN,
          payload: {
            orderId: order.id,
            orderNumber: String(order.orderNumber),
            amount: Number(order.totalAmount),
            refId: String(verifyResult.refId ?? ""),
            customerName,
            city,
          },
        })

        // ۲. ایمیل تأیید سفارش به مشتری
        if (order.user?.email) {
          await enqueue(tx, {
            event: OUTBOX_EVENTS.ORDER_PAID,
            channel: OUTBOX_CHANNELS.EMAIL,
            payload: {
              emailType: "order_confirmation",
              to: order.user.email,
              orderNumber: String(order.orderNumber),
              customerName,
              items: order.items.map((it) => ({
                nameFa: it.product.nameFa,
                quantity: it.quantity,
                unitPriceToman: Number(it.unitPrice),
              })),
              totalAmount: Number(order.totalAmount),
              freightCost: Number(order.shippingCost),
              destinationCity: city,
              paymentMethod: "ONLINE",
            },
          })
        }
      })
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/checkout/success?order=${verifyResult.orderId}`, req.url))
}
