import { NextRequest, NextResponse } from "next/server"
import { paymentService } from "@tirajeh/integrations"
import { db } from "@tirajeh/database"
import { releaseOrderStock } from "@/lib/stock"
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
      await releaseOrderStock(tx as any, orderId)
      await tx.orderEvent.create({ data: { orderId, status: "CANCELLED", note: "لغو پرداخت توسط کاربر" } })
    })
    return NextResponse.redirect(new URL(`/${locale}/checkout/cancelled`, req.url))
  }

  const verifyResult = await paymentService.verifyPayment(Authority)

  if (!verifyResult.success) {
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } })
      await releaseOrderStock(tx as any, orderId)
    })
    return NextResponse.redirect(new URL(`/${locale}/checkout/cancelled`, req.url))
  }

  return NextResponse.redirect(new URL(`/${locale}/checkout/success?order=${verifyResult.orderId}`, req.url))
}
