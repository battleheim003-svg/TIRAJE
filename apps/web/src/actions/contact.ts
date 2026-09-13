"use server"

import { ContactSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { db } from "@tirajeh/database"
import { notifyNewContact, emailService } from "@tirajeh/integrations"

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
  void emailService
    .sendContactNotice({
      name,
      email,
      phone: phone || "",
      subject,
      message,
    })
    .catch((err: unknown) => console.error("[contact] sendContactNotice error:", err))

  return { success: true, data: undefined }
}
