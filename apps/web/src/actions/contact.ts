"use server"

import { ContactSchema, OUTBOX_EVENTS, OUTBOX_CHANNELS } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { db } from "@tirajeh/database"
import { rateLimit, enqueue } from "@tirajeh/integrations"
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

  await db.$transaction(async (tx) => {
    const contact = await tx.contact.create({
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

    // Enqueue telegram admin notification
    await enqueue(tx, {
      event: OUTBOX_EVENTS.CONTACT_CREATED,
      channel: OUTBOX_CHANNELS.TG_ADMIN,
      payload: {
        contactId: contact.id,
        name,
        email: email || null,
        phone: phone || null,
        subject,
        message,
        source: "WEBSITE",
      },
    })

    // Enqueue email notification
    await enqueue(tx, {
      event: OUTBOX_EVENTS.CONTACT_CREATED,
      channel: OUTBOX_CHANNELS.EMAIL,
      payload: {
        emailType: "contact_notice",
        name,
        email: email || "",
        phone: phone || "",
        subject,
        message,
      },
    })
  })

  return { success: true, data: undefined }
}
