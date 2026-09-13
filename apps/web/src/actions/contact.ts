"use server"

import { ContactSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { db } from "@tirajeh/database"
import { notifyNewContact, emailService, rateLimit } from "@tirajeh/integrations"
import { getClientIp } from "@/lib/ip"

const RATE_LIMIT_MESSAGE = "تعداد درخواستهای شما بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید."

export async function contactAction(formData: FormData): Promise<ActionResult> {
  const ip = await getClientIp()

  // Rate limit by IP (5 per 3600s)
  const rl = await rateLimit(`contact:ip:${ip}`, 5, 3600)
  if (!rl.ok) {
    return {
      success: false,
      error: RATE_LIMIT_MESSAGE,
      retryAfterSec: rl.retryAfterSec,
    }
  }

  const raw = Object.fromEntries(formData)

  // Honeypot check
  if (typeof raw._hp === "string" && raw._hp.trim() !== "") {
    console.warn("honeypot triggered — contact", { ip })
    return { success: true, data: undefined }
  }

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
