"use server"

import { ContactSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { db } from "@tirajeh/database"
import { notifyNewContact, emailService } from "@tirajeh/integrations"

const TO_EMAIL = "info@tirajeconcrete.com"

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

  // Save to database
  try {
    await db.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
        source: "WEBSITE",
        status: "UNREAD",
      },
    })
  } catch (dbErr) {
    console.error("[contact] db insert error:", dbErr)
  }

  // Telegram notification to admin (fire-and-forget)
  void notifyNewContact({
    name,
    email,
    phone,
    subject,
    message,
    source: "WEBSITE",
  }).catch((err: unknown) => console.error("[contact] notifyNewContact error:", err))

  // Email notification (fire-and-forget)
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

  void emailService.sendContactEmail({
    to: TO_EMAIL,
    subject: `[تماس] ${subject} — از ${name}`,
    replyTo: email,
    html,
  })

  return { success: true, data: undefined }
}
