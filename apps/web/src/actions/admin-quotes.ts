"use server"

import { db, QuoteStatus } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

export async function adminUpdateQuoteAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.QUOTES_UPDATE)

  const quoteId = (formData.get("quoteId") as string | null)?.trim()
  if (!quoteId) throw new Error("Quote ID missing")

  const status = (formData.get("status") as string | null)?.trim()
  if (!status) throw new Error("Status missing")

  const quotedPriceRaw = (formData.get("quotedPrice") as string | null)?.trim()
  const quotedPrice = quotedPriceRaw ? parseInt(quotedPriceRaw, 10) : null
  const adminNote = (formData.get("adminNote") as string | null)?.trim() || null

  const expiresAtRaw = (formData.get("expiresAt") as string | null)?.trim()
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null

  const quote = await db.quoteRequest.findUnique({ where: { id: quoteId }, select: { id: true } })
  if (!quote) throw new Error("Quote not found")

  await db.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status: status as QuoteStatus,
      quotedPrice: quotedPrice ?? null,
      adminNote,
      handlerId: user.id,
      expiresAt,
    },
  })

  await audit({
    userId: user.id,
    action: "quote.update",
    resource: "QuoteRequest",
    resourceId: quoteId,
    after: { status },
  })

  revalidatePath(`/admin/quotes/${quoteId}`)
  revalidatePath("/admin/quotes")
  return { ok: true }
}
