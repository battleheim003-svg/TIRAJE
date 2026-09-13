"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { sendTelegramDirectMessage } from "@tirajeh/integrations"
import { ReplyTicketSchema, escapeHtml, PERMISSIONS } from "@tirajeh/shared"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { audit } from "@/lib/audit"

export async function adminReplyTicketAction(formData: FormData): Promise<{ ok: true }> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.TICKETS_REPLY)

  const parsed = ReplyTicketSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است"
    throw new Error(msg)
  }

  const { ticketId, replyText, status } = parsed.data

  const contact = await db.contact.findUnique({
    where: { id: ticketId },
  })

  if (!contact) {
    throw new Error("تیکت یافت نشد")
  }

  await db.contact.update({
    where: { id: ticketId },
    data: {
      status,
      replyText,
      repliedAt: new Date(),
      handlerId: user.id,
    },
  })

  await audit({
    userId: user.id,
    action: "ticket.reply",
    resource: "Contact",
    resourceId: ticketId,
  })

  // If from Telegram, send the reply directly to the user's Telegram chat
  if (contact.source === "TELEGRAM" && contact.telegramChatId) {
    const shortId = contact.id.split("-")[0]?.toUpperCase() ?? contact.id
    const text = [
      `📩 <b>پاسخ به تیکت پشتیبانی [#${escapeHtml(shortId)}]</b>`,
      "",
      escapeHtml(replyText),
      "",
      "تیراژه — همراه مطمئن پروژه‌های ساختمانی شما",
    ].join("\n")

    void sendTelegramDirectMessage(contact.telegramChatId, text).catch((tgErr) =>
      console.error("[admin-tickets] Telegram reply delivery error:", tgErr)
    )
  }

  revalidatePath(`/admin/tickets/${ticketId}`)
  revalidatePath("/admin/tickets")
  return { ok: true }
}
