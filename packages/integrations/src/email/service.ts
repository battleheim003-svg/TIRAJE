import { Resend } from "resend"
import { render } from "@react-email/render"
import * as React from "react"
import {
  OrderConfirmEmail,
  QuoteResponseEmail,
  WelcomeEmail,
} from "./templates"
import { ContactNoticeEmail, type ContactNoticeEmailProps } from "./templates/contact-notice"

export type { ContactNoticeEmailProps }

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error("RESEND_API_KEY env var is required")
    _resend = new Resend(apiKey)
  }
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? "info@tirajeh.ir"

// ─── Email Service ────────────────────────────────────────────────────────────

export class EmailService {
  private async send(to: string, subject: string, element: React.ReactElement) {
    const html = await render(element)
    const resend = getResend()
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) {
      // Log but don't throw — email failure must never block the user flow
      console.error("[email:send]", to, subject, error)
    }
  }

  async sendOrderConfirmation(params: {
    to: string
    orderNumber: string
    recipientName: string
    totalAmount: number
    itemCount: number
    estimatedDays: string
    orderId: string
  }) {
    const trackingUrl = `${process.env.NEXTAUTH_URL}/account/orders/${params.orderId}`
    await this.send(
      params.to,
      `تأیید سفارش ${params.orderNumber} — تیراژه`,
      React.createElement(OrderConfirmEmail, { ...params, trackingUrl })
    )
  }

  async sendQuoteResponse(params: {
    to: string
    recipientName: string
    productName: string
    quantityTon: number
    quotedPrice: number | null
    status: "QUOTED" | "REJECTED"
    adminNote: string | null
    expiresAt: Date | null
  }) {
    const subject =
      params.status === "QUOTED"
        ? "پاسخ استعلام قیمت شما — تیراژه"
        : "بررسی استعلام قیمت — تیراژه"
    await this.send(params.to, subject, React.createElement(QuoteResponseEmail, params))
  }

  async sendWelcome(params: { to: string; name: string }) {
    await this.send(
      params.to,
      "خوش آمدید به تیراژه",
      React.createElement(WelcomeEmail, { name: params.name })
    )
  }

  async sendContactNotice(params: ContactNoticeEmailProps): Promise<void> {
    const to = process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || "info@tirajeconcrete.com"
    await this.send(
      to,
      `پیام تماس جدید: ${params.subject} — از ${params.name}`,
      React.createElement(ContactNoticeEmail, params)
    )
  }

  async sendContactEmail(params: { to: string; subject: string; html: string; replyTo?: string }) {
    try {
      if (!process.env.RESEND_API_KEY) return
      const resend = getResend()
      await resend.emails.send({
        from: FROM,
        to: params.to,
        reply_to: params.replyTo,
        subject: params.subject,
        html: params.html,
      })
    } catch (err) {
      console.error("[email:sendContact]", err)
    }
  }
}

export const emailService = new EmailService()
