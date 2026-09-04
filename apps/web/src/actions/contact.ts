"use server"

import { ContactSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const TO_EMAIL = "info@tirajeconcrete.com"
const FROM_EMAIL = "onboarding@resend.dev" // پس از verify دامنه: noreply@tirajeconcrete.com

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID

async function notifyTelegram(name: string, email: string, phone: string | undefined, subject: string, message: string) {
  if (!TG_TOKEN || !TG_CHAT_ID) return
  const text = [
    `📩 *پیام جدید از فرم تماس تیراژه*`,
    ``,
    `👤 *نام:* ${name}`,
    `📧 *ایمیل:* ${email}`,
    phone ? `📞 *تلفن:* ${phone}` : null,
    `📌 *موضوع:* ${subject}`,
    ``,
    `💬 *پیام:*`,
    message,
  ].filter(Boolean).join("\n")

  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: "Markdown" }),
  }).catch((err) => console.error("[contact] telegram error:", err))
}

export async function contactAction(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData)
  const parsed = ContactSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { name, email, phone, subject, message } = parsed.data

  const html = `
    <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">پیام جدید از فرم تماس تیراژه</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <tr><td style="padding: 0.5rem; color: #6b7280; width: 120px;">نام:</td><td style="padding: 0.5rem; font-weight: 600;">${name}</td></tr>
        <tr><td style="padding: 0.5rem; color: #6b7280;">ایمیل:</td><td style="padding: 0.5rem;" dir="ltr">${email}</td></tr>
        ${phone ? `<tr><td style="padding: 0.5rem; color: #6b7280;">تلفن:</td><td style="padding: 0.5rem;" dir="ltr">${phone}</td></tr>` : ""}
        <tr><td style="padding: 0.5rem; color: #6b7280;">موضوع:</td><td style="padding: 0.5rem; font-weight: 600;">${subject}</td></tr>
      </table>
      <div style="margin-top: 1.5rem; background: #f9fafb; border-radius: 8px; padding: 1rem;">
        <p style="color: #6b7280; margin: 0 0 0.5rem;">پیام:</p>
        <p style="margin: 0; line-height: 1.75; white-space: pre-wrap;">${message}</p>
      </div>
    </div>
  `

  // Telegram (fire-and-forget)
  void notifyTelegram(name, email, phone, subject, message)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      reply_to: email,
      subject: `[تماس] ${subject} — از ${name}`,
      html,
    })

    if (error) {
      console.error("[contact] resend error:", error)
      return { success: false, error: "ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید." }
    }
  } catch (err) {
    console.error("[contact] unexpected error:", err)
    return { success: false, error: "خطای سرور. لطفاً دوباره تلاش کنید." }
  }

  return { success: true, data: undefined }
}
