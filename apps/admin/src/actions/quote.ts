"use server"

import { db } from "@tirajeh/database"
import { auth, requirePermission } from "@tirajeh/auth"
import { RespondQuoteSchema } from "@tirajeh/shared"
import { PERMISSIONS } from "@tirajeh/shared"
import type { ActionResult } from "@tirajeh/shared"
import { revalidatePath } from "next/cache"
import { writeAuditLog } from "./_audit"

async function getSessionOrThrow() {
  const session = await auth()
  if (!session?.user) throw new Error("UNAUTHENTICATED")
  return session
}

export async function respondToQuoteAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionOrThrow()
  requirePermission(session.user.permissions as string[], PERMISSIONS.QUOTE_RESPOND)

  const parsed = RespondQuoteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: "اطلاعات نامعتبر",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { quoteId, status, quotedPrice, adminNote, expiresAt } = parsed.data

  const quote = await db.quoteRequest.findUnique({ where: { id: quoteId } })
  if (!quote) return { success: false, error: "استعلام یافت نشد" }

  await db.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status,
      quotedPrice: quotedPrice ?? null,
      adminNote: adminNote ?? null,
      handlerId: session.user.id,
      expiresAt: expiresAt ?? null,
    },
  })

  await writeAuditLog({
    userId: session.user.id,
    action: "status_change",
    resource: "quote",
    resourceId: quoteId,
    oldValues: { status: quote.status },
    newValues: { status, quotedPrice },
  })

  revalidatePath("/quotes")
  return { success: true, data: undefined }
}
