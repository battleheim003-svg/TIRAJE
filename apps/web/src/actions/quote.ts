"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { CreateQuoteSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { notifyNewQuote } from "@tirajeh/integrations"

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  NORMAL: "عادی",
  CONTRACTOR: "پیمانکار",
  COMPANY: "شرکت",
}

export async function createQuoteAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  const raw = Object.fromEntries(formData)
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
