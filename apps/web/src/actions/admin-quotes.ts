"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { revalidatePath } from "next/cache"

const ADMIN_ROLES = ["admin", "super_admin"]

async function requireAdmin() {
  const session = await auth()
  const roleName = (session?.user as any)?.roleName as string | undefined
  if (!session?.user || !roleName || !ADMIN_ROLES.includes(roleName)) {
    throw new Error("Unauthorized")
  }
  return session.user as any
}

export async function adminUpdateQuoteAction(
  formData: FormData
): Promise<{ ok: true }> {
  const admin = await requireAdmin()

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
      status: status as any,
      quotedPrice: quotedPrice ?? null,
      adminNote,
      handlerId: admin.id,
      expiresAt,
    },
  })

  revalidatePath(`/admin/quotes/${quoteId}`)
  revalidatePath("/admin/quotes")
  return { ok: true }
}
