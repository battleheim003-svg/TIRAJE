import { db } from "@tirajeh/database"
import { cache } from "react"
import { OUTBOX_EVENTS } from "@tirajeh/shared"

export interface ActivityItem {
  id: string
  label: string          // متن نمایشی فارسی
  href: string           // لینک به صفحه مرتبط
  createdAt: Date
  kind: "order" | "quote" | "contact" | "price" | "other"
}

/**
 * آخرین ۱۰ رویداد از جدول Outbox (رویدادهای اعلان) + OrderEvent.
 * فقط رویدادهای SENT یا PENDING — نه DEAD.
 */
export const getRecentActivity = cache(async (): Promise<ActivityItem[]> => {
  try {
    const [outboxItems, orderEvents] = await Promise.all([
      db.outbox.findMany({
        where: { status: { in: ["SENT", "PENDING"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, event: true, payload: true, createdAt: true },
      }),
      db.orderEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, status: true, note: true, createdAt: true, orderId: true },
      }),
    ])

    const items: ActivityItem[] = [
      ...outboxItems.map((o) => mapOutboxToActivity(o)),
      ...orderEvents.map((e) => mapOrderEventToActivity(e)),
    ]

    return items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
  } catch {
    return []
  }
})

function mapOutboxToActivity(o: { id: string; event: string; payload: unknown; createdAt: Date }): ActivityItem {
  const payload = (typeof o.payload === "object" && o.payload !== null ? o.payload : {}) as Record<string, unknown>
  const orderId = typeof payload.orderId === "string" ? payload.orderId : undefined
  const orderNumber = typeof payload.orderNumber === "number" ? payload.orderNumber : undefined
  const quoteId = typeof payload.quoteId === "string" ? payload.quoteId : (typeof payload.id === "string" && o.event.startsWith("quote.") ? payload.id : undefined)
  const contactId = typeof payload.contactId === "string" ? payload.contactId : (typeof payload.id === "string" && o.event.startsWith("contact.") ? payload.id : undefined)
  const shortOrderId = orderNumber ? `#${orderNumber}` : (orderId ? `#${orderId.slice(0, 8)}` : "")

  switch (o.event) {
    case OUTBOX_EVENTS.ORDER_CREATED:
      return {
        id: `outbox-${o.id}`,
        label: `سفارش جدید ${shortOrderId} ثبت شد`,
        href: orderId ? `/admin/orders/${orderId}` : "/admin/orders",
        createdAt: o.createdAt,
        kind: "order",
      }
    case OUTBOX_EVENTS.ORDER_PAID:
      return {
        id: `outbox-${o.id}`,
        label: `پرداخت سفارش ${shortOrderId} با موفقیت انجام شد`,
        href: orderId ? `/admin/orders/${orderId}` : "/admin/orders",
        createdAt: o.createdAt,
        kind: "order",
      }
    case OUTBOX_EVENTS.ORDER_STATUS_CHANGED: {
      const newStatus = typeof payload.newStatus === "string" ? payload.newStatus : (typeof payload.status === "string" ? payload.status : "")
      return {
        id: `outbox-${o.id}`,
        label: `تغییر وضعیت سفارش ${shortOrderId}${newStatus ? ` به ${newStatus}` : ""}`,
        href: orderId ? `/admin/orders/${orderId}` : "/admin/orders",
        createdAt: o.createdAt,
        kind: "order",
      }
    }
    case OUTBOX_EVENTS.QUOTE_CREATED:
      return {
        id: `outbox-${o.id}`,
        label: "استعلام قیمت جدید ثبت شد",
        href: quoteId ? `/admin/quotes/${quoteId}` : "/admin/quotes",
        createdAt: o.createdAt,
        kind: "quote",
      }
    case OUTBOX_EVENTS.QUOTE_ANSWERED:
      return {
        id: `outbox-${o.id}`,
        label: "پاسخ استعلام قیمت ارسال شد",
        href: quoteId ? `/admin/quotes/${quoteId}` : "/admin/quotes",
        createdAt: o.createdAt,
        kind: "quote",
      }
    case OUTBOX_EVENTS.CONTACT_CREATED:
      return {
        id: `outbox-${o.id}`,
        label: "پیام پشتیبانی جدید دریافت شد",
        href: contactId ? `/admin/tickets/${contactId}` : "/admin/tickets",
        createdAt: o.createdAt,
        kind: "contact",
      }
    case OUTBOX_EVENTS.PRICE_PUBLISHED:
      return {
        id: `outbox-${o.id}`,
        label: "قیمت‌های روز جدید منتشر شد",
        href: "/admin/daily-price",
        createdAt: o.createdAt,
        kind: "price",
      }
    case OUTBOX_EVENTS.PRODUCT_UPDATED:
      return {
        id: `outbox-${o.id}`,
        label: "مشخصات یا موجودی محصول به‌روز شد",
        href: "/admin/products",
        createdAt: o.createdAt,
        kind: "other",
      }
    default:
      return {
        id: `outbox-${o.id}`,
        label: `رویداد سیستم: ${o.event}`,
        href: "/admin/dashboard",
        createdAt: o.createdAt,
        kind: "other",
      }
  }
}

function mapOrderEventToActivity(e: { id: string; status: string; note: string | null; createdAt: Date; orderId: string }): ActivityItem {
  return {
    id: `event-${e.id}`,
    label: `سفارش #${e.orderId.slice(0, 8)} ← ${e.status}`,
    href: `/admin/orders/${e.orderId}`,
    createdAt: e.createdAt,
    kind: "order",
  }
}
