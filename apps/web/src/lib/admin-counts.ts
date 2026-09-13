import { db } from "@tirajeh/database"
import { cache } from "react"

export interface AdminCounts {
  pendingOrders: number      // ORDER.status IN ('PENDING', 'AWAITING_PAYMENT')
  openTickets: number        // Contact without replyText (status !== REPLIED)
  unansweredQuotes: number   // QuoteRequest.status === 'PENDING'
}

/**
 * یک‌بار در هر request اجرا می‌شود (React cache).
 * در صورت خطا: مقادیر پیش‌فرض صفر برمی‌گرداند — هرگز layout را کرش نمی‌دهد.
 */
export const getAdminCounts = cache(async (): Promise<AdminCounts> => {
  try {
    const [pendingOrders, openTickets, unansweredQuotes] = await Promise.all([
      db.order.count({ where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } } }),
      db.contact.count({ where: { replyText: null } }),
      db.quoteRequest.count({ where: { status: "PENDING" } }),
    ])
    return { pendingOrders, openTickets, unansweredQuotes }
  } catch {
    return { pendingOrders: 0, openTickets: 0, unansweredQuotes: 0 }
  }
})
