"use server"

import { db } from "@tirajeh/database"
import type { TruckType } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { AppError, OutOfStockError } from "@tirajeh/shared"
import { releaseOrderStock } from "../lib/stock"
import { calculateShippingCost } from "../lib/shipping"

export async function checkoutAction(
  formData: FormData
): Promise<{ success: false; error: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "لطفاً ابتدا وارد شوید" }
  const userId = (session.user as any).id
  const locale = await getLocale()

  const cartItems = await db.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: { id: true, nameFa: true, price: true, stockQty: true, isActive: true, weightKg: true },
      },
    },
  })

  if (cartItems.length === 0) return { success: false, error: "سبد خرید خالی است" }

  for (const item of cartItems) {
    if (!item.product.isActive)
      return { success: false, error: `محصول ${item.product.nameFa} در دسترس نیست` }
    if (item.product.stockQty < item.quantity)
      return { success: false, error: `موجودی ${item.product.nameFa} کافی نیست` }
  }

  const province = (formData.get("province") as string || "").trim()
  const truckType = formData.get("truckType") as TruckType | null

  if (!province || !truckType) {
    return { success: false, error: "استان و نوع ماشین حمل الزامی است" }
  }

  const shippingAddress = {
    recipientName: (formData.get("recipientName") as string).trim(),
    phone: (formData.get("phone") as string).trim(),
    province,
    city: (formData.get("city") as string).trim(),
    street: (formData.get("street") as string).trim(),
    postalCode: ((formData.get("postalCode") as string) || "").trim() || null,
  }
  const note = ((formData.get("note") as string) || "").trim() || null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )

  const totalWeightKg = cartItems.reduce(
    (sum, item) => sum + (Number(item.product.weightKg || 0) * item.quantity),
    0
  )

  let shippingCostToman = 0
  try {
    const quote = await calculateShippingCost(province, truckType, totalWeightKg)
    shippingCostToman = quote.totalCostToman
  } catch (err: any) {
    if (err instanceof AppError && err.code === "SHIPPING_NOT_FOUND") {
       return { success: false, error: err.message }
    }
    return { success: false, error: "خطا در محاسبه هزینه حمل" }
  }

  const totalAmount = subtotal + shippingCostToman

  try {
    const order = await db.$transaction(async (tx) => {
      for (const line of cartItems) {
        const res = await tx.product.updateMany({
          where: {
            id: line.productId,
            stockQty: { gte: line.quantity },
            isActive: true,
          },
          data: { stockQty: { decrement: line.quantity } },
        })
        if (res.count !== 1) throw new OutOfStockError(line.product.nameFa)
      }

      const o = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          subtotal,
          shippingCost: shippingCostToman,
          shippingTruckType: truckType,
          shippingProvince: province,
          totalAmount,
          shippingAddress,
          notes: note,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
              totalPrice: Number(item.product.price) * item.quantity,
              productNameFa: item.product.nameFa,
              weightKg: item.product.weightKg ?? null,
              packagingTier: item.packagingTier,
            })),
          },
        },
        select: { id: true, orderNumber: true },
      })

      await tx.orderEvent.create({
        data: { orderId: o.id, status: "PENDING", note: "سفارش ثبت شد" }
      })

      await tx.cartItem.deleteMany({ where: { userId } })

      return o
    })

    revalidatePath("/cart")
    revalidatePath("/account/orders")
    redirect(`/${locale}/checkout/success?order=${order.orderNumber}`)
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT") || err?.message?.includes("NEXT_REDIRECT")) {
      throw err
    }
    if (err?.message?.includes?.("موجودی")) {
      return { success: false, error: err.message }
    }
    return { success: false, error: "خطای داخلی سرور هنگام ثبت سفارش" }
  }
}

export async function cancelOrderAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "لطفاً وارد شوید" }
  const userId = (session.user as any).id

  const orderId = (formData.get("orderId") as string | null)?.trim()
  if (!orderId) return { success: false, error: "سفارش مشخص نشده" }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true },
  })
  if (!order || order.userId !== userId) return { success: false, error: "سفارش یافت نشد" }
  if (!["PENDING", "CONFIRMED"].includes(order.status))
    return { success: false, error: "این سفارش قابل لغو نیست" }

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } })
    await releaseOrderStock(tx, orderId)
    await tx.orderEvent.create({
      data: { orderId, status: "CANCELLED", note: "لغو توسط مشتری" }
    })
  })

  revalidatePath("/account/orders")
  return { success: true }
}
