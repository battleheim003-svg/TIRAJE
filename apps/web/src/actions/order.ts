"use server"

import { db } from "@tirajeh/database"
import { CheckoutSchema, CancelOrderSchema } from "@tirajeh/shared"
import { safeAction, parseOrThrow, NotFoundError, ValidationError } from "@tirajeh/shared"
import { requireAuth } from "@tirajeh/auth"
import { calculateFreight } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { randomUUID } from "crypto"

function extractAddress(raw: Record<string, FormDataEntryValue>) {
  return {
    recipientName: raw["address.recipientName"],
    phone: raw["address.phone"],
    province: raw["address.province"],
    city: raw["address.city"],
    district: raw["address.district"],
    street: raw["address.street"],
    postalCode: raw["address.postalCode"],
  }
}

export const checkoutAction = safeAction(
  "checkout",
  async (formData: FormData): Promise<ActionResult<{ orderId: string }>> => {
    const session = await requireAuth()
    const raw = Object.fromEntries(formData)

    const data = parseOrThrow(CheckoutSchema, {
      shippingAddress: extractAddress(raw),
      shippingRateId: raw.shippingRateId,
      couponCode: raw.couponCode,
      note: raw.note,
      paymentGateway: raw.paymentGateway,
    })

    // Load cart with products
    const cart = await db.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                pricePerTon: true,
                stockTon: true,
                weightPerUnit: true,
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0)
      throw new ValidationError("سبد خرید خالی است")

    // Validate stock for every item before opening transaction
    for (const item of cart.items) {
      if (!item.product.isActive)
        throw new ValidationError(`محصول "${item.product.name}" در دسترس نیست`)
      if (Number(item.product.stockTon) < Number(item.quantityTon))
        throw new ValidationError(`موجودی محصول "${item.product.name}" کافی نیست`)
    }

    const shippingRate = await db.shippingRate.findUnique({
      where: { id: data.shippingRateId },
    })
    if (!shippingRate) throw new NotFoundError("روش ارسال")

    const totalWeightTon = cart.items.reduce(
      (s: number, i: any) => s + Number(i.quantityTon),
      0
    )
    const subtotal = cart.items.reduce(
      (s: number, i: any) => s + Number(i.product.pricePerTon) * Number(i.quantityTon),
      0
    )
    const freightCost = calculateFreight(
      Number(shippingRate.baseCost),
      Number(shippingRate.costPerTon),
      totalWeightTon
    )
    const taxAmount = Math.round(subtotal * 0.1)
    const totalAmount = subtotal + freightCost + taxAmount

    const orderNumber = `ORD-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`
    const { shippingAddress: addr } = data

    // Atomic transaction: order + stock + cart clear + payment record
    const order = await db.$transaction(async (tx) => {
      // Re-check stock inside transaction to prevent race condition
      for (const item of cart.items) {
        const fresh = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockTon: true, name: true },
        })
        if (!fresh || Number(fresh.stockTon) < Number(item.quantityTon)) {
          throw new ValidationError(
            `موجودی محصول "${item.product.name}" در زمان ثبت سفارش ناکافی بود`
          )
        }
      }

      const o = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: "PENDING",
          subtotal,
          shippingCost: freightCost,
          taxAmount,
          totalAmount,
          shippingRateId: data.shippingRateId,
          shippingZoneId: shippingRate.zoneId,
          recipientName: addr.recipientName,
          recipientPhone: addr.phone,
          deliveryProvince: addr.province,
          deliveryCity: addr.city,
          deliveryDistrict: addr.district ?? null,
          deliveryStreet: addr.street,
          deliveryPostalCode: addr.postalCode ?? null,
          deliveryLatitude: addr.latitude ?? null,
          deliveryLongitude: addr.longitude ?? null,
          note: data.note ?? null,
          items: {
            create: cart.items.map((i: any) => ({
              productId: i.productId,
              productName: i.product.name,
              pricePerTon: i.product.pricePerTon,
              quantityTon: i.quantityTon,
              weightKg: Number(i.quantityTon) * Number(i.product.weightPerUnit),
              subtotal: Number(i.product.pricePerTon) * Number(i.quantityTon),
            })),
          },
        },
        select: { id: true },
      })

      // Decrement stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockTon: { decrement: Number(item.quantityTon) } },
        })
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

      // Payment record (PENDING — gateway call happens in payment route handler)
      await tx.payment.create({
        data: {
          orderId: o.id,
          amount: totalAmount,
          gateway: data.paymentGateway as "ZARINPAL" | "IDPAY",
          status: "PENDING",
        },
      })

      return o
    })

    revalidatePath("/cart")
    redirect(`/checkout/payment?orderId=${order.id}`)
  }
)

export const cancelOrderAction = safeAction(
  "cancelOrder",
  async (formData: FormData): Promise<ActionResult> => {
    const session = await requireAuth()
    const data = parseOrThrow(CancelOrderSchema, Object.fromEntries(formData))

    const order = await db.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, userId: true, status: true },
    })

    if (!order || order.userId !== session.user.id) throw new NotFoundError("سفارش")

    if (!["PENDING", "CONFIRMED"].includes(order.status))
      throw new ValidationError("این سفارش قابل لغو نیست")

    await db.$transaction(async (tx: any) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } })
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CANCELLED",
          note: data.reason,
          changedBy: session.user.id,
        },
      })
    })

    revalidatePath("/account/orders")
    return { success: true, data: undefined }
  }
)
