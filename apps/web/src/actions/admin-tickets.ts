"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { revalidatePath } from "next/cache"
import { sendTelegramDirectMessage } from "@tirajeh/integrations"
import { ReplyTicketSchema } from "@tirajeh/shared"

const ADMIN_ROLES = ["admin", "super_admin"]

async function requireAdmin() {
  const session = await auth()
  const roleName = (session?.user as any)?.roleName as string | undefined
  if (!session?.user || !roleName || !ADMIN_ROLES.includes(roleName)) {
    throw new Error("Unauthorized")
  }
  return session.user as any
}

export async function adminReplyTicketAction(formData: FormData): Promise<{ ok: true }> {
  const admin = await requireAdmin()

  const raw = {
    ticketId: (formData.get("ticketId") as string | null)?.trim() ?? "",
    replyText: (formData.get("replyText") as string | null)?.trim() ?? "",
    status: ((formData.get("status") as string | null)?.trim() || "REPLIED") as "READ" | "REPLIED",
  }

  const parsed = ReplyTicketSchema.safeParse(raw)
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
      handlerId: admin.id,
    },
  })

  // If from Telegram, send the reply directly to the user's Telegram chat
  if (contact.source === "TELEGRAM" && contact.telegramChatId) {
    const shortId = contact.id.split("-")[0]?.toUpperCase() ?? contact.id
    const text = [
      `📩 <b>پاسخ به تیکت پشتیبانی [#${shortId}]</b>`,
      "",
      replyText,
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
