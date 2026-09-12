/**
 * Payment service — orchestrates the full pay→verify→update-DB lifecycle.
 * The gateway adapter is injected so swapping to IDPay requires zero changes here.
 */
import { db } from "@tirajeh/database"
import type { PaymentGatewayAdapter } from "./types"
import { AppError, tomanToRial } from "@tirajeh/shared"

export class PaymentService {
  constructor(private readonly gateway: PaymentGatewayAdapter) {}

  /** Called from web app's /checkout/payment page (server action or route handler) */
  async initiatePayment(orderId: string, callbackUrl: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { phone: true, email: true } },
        payments: true,
      },
    })

    if (!order) throw new AppError("سفارش یافت نشد", "NOT_FOUND", 404)
    const latestPayment = order.payments[0]
    if (!latestPayment) throw new AppError("رکورد پرداخت یافت نشد", "NOT_FOUND", 404)
    if (latestPayment.status === "COMPLETED")
      throw new AppError("این سفارش قبلاً پرداخت شده", "CONFLICT", 409)

    // مرز تبدیل تومان → ریال؛ تنها نقطه مجاز
    const result = await this.gateway.init({
      amount: tomanToRial(Number(order.totalAmount)),
      description: `پرداخت سفارش ${order.orderNumber} — تیراژه`,
      callbackUrl,
      mobile: order.user?.phone ?? undefined,
      email: order.user?.email ?? undefined,
      orderId: order.id,
    })

    // Persist authority for verification step
    await db.payment.update({
      where: { id: latestPayment.id },
      data: {
        gatewayRef: result.authority,
        gateway: this.gateway.name as "ZARINPAL" | "IDPAY",
        gatewayResponse: result.rawResponse as never,
      },
    })

    return result.redirectUrl
  }

  /**
   * Called from the callback route handler (/api/payment/callback).
   * Returns whether payment succeeded and the order ID.
   */
  async verifyPayment(authority: string): Promise<{
    success: boolean
    orderId: string
    refId: string | null
  }> {
    const payment = await db.payment.findFirst({
      where: { gatewayRef: authority },
      include: { order: { select: { id: true, totalAmount: true, orderNumber: true } } },
    })

    if (!payment) throw new AppError("رکورد پرداخت یافت نشد", "NOT_FOUND", 404)
    if (payment.status === "COMPLETED") {
      // Idempotent: already verified, return cached result
      return { success: true, orderId: payment.orderId, refId: payment.gatewayTrackId }
    }

    // مرز تبدیل تومان → ریال؛ تنها نقطه مجاز
    const result = await this.gateway.verify({
      authority,
      amount: tomanToRial(Number(payment.order.totalAmount)),
    })

    if (result.success) {
      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            gatewayTrackId: result.refId,
            paidAt: new Date(),
            gatewayResponse: result.rawResponse as never,
          },
        }),
        db.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        }),
        db.orderEvent.create({
          data: {
            orderId: payment.orderId,
            status: "CONFIRMED",
            note: `پرداخت موفق — refId: ${result.refId}`,
          },
        }),
      ])
    } else {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          gatewayResponse: result.rawResponse as never,
        },
      })
    }

    return { success: result.success, orderId: payment.orderId, refId: result.refId }
  }
}

import { getZarinpalAdapter } from "./zarinpal"

let _service: PaymentService | null = null
function getService(): PaymentService {
  if (!_service) {
    _service = new PaymentService(getZarinpalAdapter())
  }
  return _service
}

export const paymentService = {
  initiatePayment: (orderId: string, callbackUrl: string) =>
    getService().initiatePayment(orderId, callbackUrl),
  verifyPayment: (authority: string) =>
    getService().verifyPayment(authority),
}
