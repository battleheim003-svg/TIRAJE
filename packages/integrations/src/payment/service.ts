/**
 * Payment service — orchestrates the full pay→verify→update-DB lifecycle.
 * The gateway adapter is injected so swapping to IDPay requires zero changes here.
 */
import { db } from "@tirajeh/database"
import type { PaymentGatewayAdapter } from "./types"
import { AppError } from "@tirajeh/shared"

export class PaymentService {
  constructor(private readonly gateway: PaymentGatewayAdapter) {}

  /** Called from web app's /checkout/payment page (server action or route handler) */
  async initiatePayment(orderId: string, callbackUrl: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { phone: true, email: true } },
        payment: true,
      },
    })

    if (!order) throw new AppError("سفارش یافت نشد", "NOT_FOUND", 404)
    if (!order.payment) throw new AppError("رکورد پرداخت یافت نشد", "NOT_FOUND", 404)
    if (order.payment.status === "PAID")
      throw new AppError("این سفارش قبلاً پرداخت شده", "CONFLICT", 409)

    const result = await this.gateway.init({
      amount: Number(order.totalAmount),
      description: `پرداخت سفارش ${order.orderNumber} — تیراژه`,
      callbackUrl,
      mobile: order.user?.phone ?? undefined,
      email: order.user?.email ?? undefined,
      orderId: order.id,
    })

    // Persist authority for verification step
    await db.payment.update({
      where: { id: order.payment.id },
      data: {
        authority: result.authority,
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
      where: { authority },
      include: { order: { select: { id: true, totalAmount: true, orderNumber: true } } },
    })

    if (!payment) throw new AppError("رکورد پرداخت یافت نشد", "NOT_FOUND", 404)
    if (payment.status === "PAID") {
      // Idempotent: already verified, return cached result
      return { success: true, orderId: payment.orderId, refId: payment.refId }
    }

    const result = await this.gateway.verify({
      authority,
      amount: Number(payment.order.totalAmount),
    })

    if (result.success) {
      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            refId: result.refId,
            paidAt: new Date(),
            gatewayResponse: result.rawResponse as never,
          },
        }),
        db.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        }),
        db.orderStatusHistory.create({
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
