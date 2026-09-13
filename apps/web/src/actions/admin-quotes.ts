"use server"

import { db, QuoteStatus } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

import { z } from "zod"

const UpdateQuoteSchema = z.object({
  quoteId: z.string().min(1, "شناسه استعلام الزامی است").transform((s) => s.trim()),
  status: z.nativeEnum(QuoteStatus, { errorMap: () => ({ message: "وضعیت الزامی یا نامعتبر است" }) }),
  quotedPrice: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null
    return Number(v)
  }, z.number().int().nonnegative().nullable().optional()),
  adminNote: z.string().optional().nullable().transform((s) => s?.trim() || null),
  expiresAt: z.preprocess((v) => {
    if (!v) return null
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? null : d
  }, z.date().nullable().optional()),
})

export async function adminUpdateQuoteAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.QUOTES_UPDATE)

  const parsed = UpdateQuoteSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی نامعتبر است")
  }

  const { quoteId, status, quotedPrice, adminNote, expiresAt } = parsed.data

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
