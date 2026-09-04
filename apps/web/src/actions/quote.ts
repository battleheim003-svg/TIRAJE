"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { CreateQuoteSchema } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"

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
    select: { id: true },
  })

  return { success: true, data: { id: quote.id } }
}
