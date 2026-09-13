import { db } from "@tirajeh/database"
import { cache } from "react"
import { tehranDayStart } from "@tirajeh/shared"

export type TaskPriority = "urgent" | "warning" | "info"

export interface TodayTask {
  id: string
  kind: "order" | "quote" | "ticket" | "price" | "stock"
  priority: TaskPriority
  label: string          // فارسی، مثل «سفارش #۱۲۳۴ منتظر تأیید»
  subLabel?: string      // اطلاعات ثانوی مثل نام شهر یا ساعت ثبت
  href: string           // لینک مستقیم به صفحه مرتبط
  actionLabel?: string   // متن دکمه اقدام مثل «تأیید کن»
  actionHref?: string    // اگر actionLabel وجود دارد
}

export const getTodayTasks = cache(async (): Promise<TodayTask[]> => {
  try {
    const now = Date.now()
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000)
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000)

    const [pendingOrders, oldQuotes, openTickets, staleProducts, lowStockProducts] = await Promise.all([
      // سفارش‌های منتظر تأیید یا پرداخت
      db.order.findMany({
        where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          shippingAddress: true,
          shippingProvince: true,
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
      // استعلام‌های بی‌پاسخ بیشتر از ۲ ساعت
      db.quoteRequest.findMany({
        where: {
          status: "PENDING",
          createdAt: { lte: twoHoursAgo },
        },
        select: {
          id: true,
          createdAt: true,
          deliveryCity: true,
          product: { select: { nameFa: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
      // تیکت‌های باز (بدون پاسخ)
      db.contact.findMany({
        where: { replyText: null },
        select: { id: true, subject: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
      // محصولاتی که قیمتشان بیشتر از ۲۴ ساعت است قدیمی شده
      db.product.findMany({
        where: {
          isActive: true,
          archivedAt: null,
          lastPriceUpdate: { lt: twentyFourHoursAgo },
        },
        select: { id: true, nameFa: true, slug: true, lastPriceUpdate: true },
        take: 10,
      }),
      // محصولات فعال با موجودی کمتر یا مساوی آستانه هشدار
      db.$queryRaw<Array<{ id: string; name_fa: string; slug: string; stock_qty: number; low_stock_threshold: number }>>`
        SELECT id, name_fa, slug, stock_qty, low_stock_threshold
        FROM products
        WHERE is_active = true
          AND archived_at IS NULL
          AND low_stock_threshold > 0
          AND stock_qty <= low_stock_threshold
        LIMIT 10
      `,
    ])

    const tasks: TodayTask[] = []

    // 1. سفارش‌ها: اگر بیش از ۴ ساعت معلق مانده -> urgent، در غیر این صورت -> warning
    for (const order of pendingOrders) {
      const isUrgent = order.createdAt.getTime() <= fourHoursAgo.getTime()
      const addr = typeof order.shippingAddress === "object" && order.shippingAddress !== null
        ? (order.shippingAddress as Record<string, unknown>)
        : null
      const city = typeof addr?.city === "string" ? addr.city : (order.shippingProvince ?? "")

      tasks.push({
        id: `order-${order.id}`,
        kind: "order",
        priority: isUrgent ? "urgent" : "warning",
        label: `سفارش #${order.orderNumber} در وضعیت ${order.status === "PENDING" ? "در انتظار بررسی" : "انتظار پرداخت"}`,
        subLabel: city ? `مقصد: ${city}` : undefined,
        href: `/admin/orders/${order.id}`,
        actionLabel: "بررسی سفارش",
        actionHref: `/admin/orders/${order.id}`,
      })
    }

    // 2. استعلام‌های قیمت بیش از ۲ ساعت -> warning
    for (const quote of oldQuotes) {
      tasks.push({
        id: `quote-${quote.id}`,
        kind: "quote",
        priority: "warning",
        label: `استعلام قیمت بی‌پاسخ: ${quote.product?.nameFa ?? "سیمان"}`,
        subLabel: quote.deliveryCity ? `تحویل: ${quote.deliveryCity}` : undefined,
        href: `/admin/quotes/${quote.id}`,
        actionLabel: "پاسخ به استعلام",
        actionHref: `/admin/quotes/${quote.id}`,
      })
    }

    // 3. محصولات زیر آستانه موجودی -> warning
    for (const p of lowStockProducts) {
      tasks.push({
        id: `stock-${p.id}`,
        kind: "stock",
        priority: "warning",
        label: `هشدار موجودی اندک: ${p.name_fa}`,
        subLabel: `موجودی فعلی: ${p.stock_qty.toLocaleString("fa-IR")} (آستانه: ${p.low_stock_threshold.toLocaleString("fa-IR")})`,
        href: `/admin/products/${p.id}`,
        actionLabel: "ویرایش موجودی",
        actionHref: `/admin/products/${p.id}`,
      })
    }

    // 4. تیکت‌های باز -> info
    for (const tkt of openTickets) {
      tasks.push({
        id: `ticket-${tkt.id}`,
        kind: "ticket",
        priority: "info",
        label: `تیکت پشتیبانی: ${tkt.subject}`,
        href: `/admin/tickets/${tkt.id}`,
        actionLabel: "مشاهده تیکت",
        actionHref: `/admin/tickets/${tkt.id}`,
      })
    }

    // 5. محصولات با قیمت قدیمی‌تر از ۲۴ ساعت -> info
    for (const prod of staleProducts) {
      tasks.push({
        id: `price-${prod.id}`,
        kind: "price",
        priority: "info",
        label: `بروزرسانی قیمت روز: ${prod.nameFa}`,
        subLabel: "قیمت بیش از ۲۴ ساعت است بروزرسانی نشده",
        href: `/admin/daily-price`,
        actionLabel: "ثبت قیمت جدید",
        actionHref: `/admin/daily-price`,
      })
    }

    // ترتیب اولویت: urgent -> warning -> info
    const priorityWeight: Record<TaskPriority, number> = {
      urgent: 3,
      warning: 2,
      info: 1,
    }

    return tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
  } catch (e) {
    console.error("[getTodayTasks] error:", e)
    return []
  }
})
