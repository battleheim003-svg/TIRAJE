"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { CreateQuoteSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { notifyNewQuote, rateLimit } from "@tirajeh/integrations"
import { getClientIp } from "@/lib/ip"

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  NORMAL: "عادی",
  CONTRACTOR: "پیمانکار",
  COMPANY: "شرکت",
}

const RATE_LIMIT_MESSAGE = "تعداد درخواستهای شما بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید."

export async function createQuoteAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ip = await getClientIp()

  // Rate limit by IP (5 per 3600s)
  const rl = await rateLimit(`quote:ip:${ip}`, 5, 3600)
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
    console.warn("honeypot triggered — quote", { ip })
    return { success: true, data: { id: "honeypot-noop" } }
  }

  const session = await auth()
  const parsed = CreateQuoteSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const quote = await db.quoteRequest.create({
    data: {
      ...parsed.data,
      userId: session?.user?.id ?? null,
      quantityTon: parsed.data.quantityTon,
    },
    include: { product: { select: { nameFa: true } } },
  })

  try {
    await notifyNewQuote({
      name: quote.name,
      productName: quote.product.nameFa,
      quantityTon: Number(quote.quantityTon),
      phone: quote.phone,
      customerType: (quote.customerType && CUSTOMER_TYPE_LABELS[quote.customerType]) || "عادی",
    })
  } catch (e) {
    console.error("[notify] quote:", e)
  }

  return { success: true, data: { id: quote.id } }
}
