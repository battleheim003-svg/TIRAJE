import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { LifeBuoy, Send, Globe } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import { formatRelativeTime } from "@/lib/cement"
import styles from "./TicketsList.module.css"

export const metadata: Metadata = { title: "تیکت‌های پشتیبانی | پنل مدیریت تیراژه" }

const PAGE_SIZE = 25

const STATUS_LABEL: Record<string, { fa: string; en: string; variant: "warning" | "info" | "success" }> = {
  UNREAD:  { fa: "خوانده‌نشده", en: "Unread",  variant: "warning" },
  READ:    { fa: "بررسی‌شده",   en: "Read",    variant: "info"    },
  REPLIED: { fa: "پاسخ‌داده‌شده", en: "Replied", variant: "success" },
}

const CATEGORY_LABEL: Record<string, { fa: string; en: string }> = {
  ACCOUNT_ISSUE:   { fa: "ورود / حساب کاربری", en: "Account"    },
  PRICE_INQUIRY:   { fa: "استعلام قیمت",       en: "Price"      },
  ORDER_ISSUE:     { fa: "پیگیری سفارش",       en: "Order"      },
  PRODUCT_INQUIRY: { fa: "مشخصات محصول",       en: "Product"    },
  TECHNICAL_ISSUE: { fa: "مشکل فنی",          en: "Technical"  },
  OTHER:           { fa: "سایر موارد",         en: "Other"      },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminTicketsPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams

  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))
  const statusFilter = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? ""
  const categoryFilter = (Array.isArray(sp.category) ? sp.category[0] : sp.category) ?? ""
  const sourceFilter = (Array.isArray(sp.source) ? sp.source[0] : sp.source) ?? ""

  const where: Record<string, unknown> = {}
  if (statusFilter) where.status = statusFilter
  if (categoryFilter) where.category = categoryFilter
  if (sourceFilter) where.source = sourceFilter

  const [tickets, total, unreadCount] = await Promise.all([
    db.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        category: true,
        source: true,
        telegramUsername: true,
        createdAt: true,
      },
    }),
    db.contact.count({ where }),
    db.contact.count({ where: { status: "UNREAD" } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  type TicketRow = (typeof tickets)[number]

  // Build query string helper
  const getQueryUrl = (key: string, val: string) => {
    const params = new URLSearchParams()
    if (page > 1) params.set("page", "1")
    if (statusFilter && key !== "status") params.set("status", statusFilter)
    if (categoryFilter && key !== "category") params.set("category", categoryFilter)
    if (sourceFilter && key !== "source") params.set("source", sourceFilter)
    if (val) params.set(key, val)
    const qs = params.toString()
    return `/${locale}/admin/tickets${qs ? `?${qs}` : ""}`
  }

  return (
    <div className={styles["web-adm-tkt__wrapper"]}>
      <div className={styles["web-adm-tkt__header"]}>
        <div>
          <h1 className={styles["web-adm-tkt__title"]}>{fa ? "تیکت‌های پشتیبانی" : "Support Tickets"}</h1>
          <p className={styles["web-adm-tkt__count"]}>
            {fa
              ? `${total} پیام (${unreadCount} خوانده‌نشده)`
              : `${total} tickets (${unreadCount} unread)`}
          </p>
        </div>
      </div>

      {/* Status filter bar */}
      <div className={styles["web-adm-tkt__filtersGroup"]}>
        <div className={styles["web-adm-tkt__filters"]}>
          <span className={styles["web-adm-tkt__filtersLabel"]}>{fa ? "وضعیت:" : "Status:"}</span>
          {[
            ["", fa ? "همه" : "All"],
            ["UNREAD", fa ? "خوانده‌نشده" : "Unread"],
            ["READ", fa ? "بررسی‌شده" : "Read"],
            ["REPLIED", fa ? "پاسخ‌داده‌شده" : "Replied"],
          ].map(([val, label]) => (
            <Link
              key={val}
              href={getQueryUrl("status", val)}
              className={`${styles["web-adm-tkt__filterTab"]}${statusFilter === val ? ` ${styles["web-adm-tkt__filterTab--active"]}` : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className={styles["web-adm-tkt__filters"]}>
          <span className={styles["web-adm-tkt__filtersLabel"]}>{fa ? "منبع:" : "Source:"}</span>
          {[
            ["", fa ? "همه" : "All"],
            ["TELEGRAM", fa ? "تلگرام" : "Telegram"],
            ["WEBSITE", fa ? "وبسایت" : "Website"],
          ].map(([val, label]) => (
            <Link
              key={val}
              href={getQueryUrl("source", val)}
              className={`${styles["web-adm-tkt__filterTab"]}${sourceFilter === val ? ` ${styles["web-adm-tkt__filterTab--active"]}` : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className={styles["web-adm-tkt__empty"]}>
          <LifeBuoy style={{ width: "2.5rem", height: "2.5rem" }} strokeWidth={1.5} aria-hidden="true" />
          <p>{fa ? "هیچ تیکتی با این مشخصات یافت نشد." : "No tickets found."}</p>
        </div>
      ) : (
        <div className={styles["web-adm-tkt__tableWrap"]}>
          <table className={styles["web-adm-tkt__table"]}>
            <thead>
              <tr>
                <th className={styles["web-adm-tkt__th"]}>{fa ? "فرستنده" : "Sender"}</th>
                <th className={styles["web-adm-tkt__th"]}>{fa ? "منبع" : "Source"}</th>
                <th className={styles["web-adm-tkt__th"]}>{fa ? "دسته‌بندی" : "Category"}</th>
                <th className={styles["web-adm-tkt__th"]}>{fa ? "موضوع / پیام" : "Subject / Message"}</th>
                <th className={`${styles["web-adm-tkt__th"]} ${styles["web-adm-tkt__thCenter"]}`}>{fa ? "وضعیت" : "Status"}</th>
                <th className={styles["web-adm-tkt__th"]}>{fa ? "تاریخ" : "Date"}</th>
                <th className={styles["web-adm-tkt__th"]}></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t: TicketRow) => {
                const sl = STATUS_LABEL[t.status] ?? {
                  fa: t.status,
                  en: t.status,
                  variant: "warning" as const,
                }
                const cat = t.category ? CATEGORY_LABEL[t.category] : null

                return (
                  <tr key={t.id} className={styles["web-adm-tkt__row"]}>
                    <td className={styles["web-adm-tkt__td"]}>
                      <div className={styles["web-adm-tkt__sender"]}>
                        <span className={styles["web-adm-tkt__name"]}>{t.name}</span>
                        {t.phone && <span className={styles["web-adm-tkt__contactInfo"]}>{t.phone}</span>}
                        {t.telegramUsername && (
                          <span className={styles["web-adm-tkt__contactInfo"]}>@{t.telegramUsername}</span>
                        )}
                        {t.email && !t.telegramUsername && (
                          <span className={styles["web-adm-tkt__contactInfo"]}>{t.email}</span>
                        )}
                      </div>
                    </td>
                    <td className={styles["web-adm-tkt__td"]}>
                      {t.source === "TELEGRAM" ? (
                        <span className={`${styles["web-adm-tkt__source"]} ${styles["web-adm-tkt__source--tg"]}`}>
                          <Send style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                          <span>{fa ? "تلگرام" : "Telegram"}</span>
                        </span>
                      ) : (
                        <span className={`${styles["web-adm-tkt__source"]} ${styles["web-adm-tkt__source--web"]}`}>
                          <Globe style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                          <span>{fa ? "وبسایت" : "Website"}</span>
                        </span>
                      )}
                    </td>
                    <td className={styles["web-adm-tkt__td"]}>
                      <span className={styles["web-adm-tkt__category"]}>
                        {cat ? (fa ? cat.fa : cat.en) : "—"}
                      </span>
                    </td>
                    <td className={styles["web-adm-tkt__td"]}>
                      <div className={styles["web-adm-tkt__subjectCell"]}>
                        <div className={styles["web-adm-tkt__subject"]}>{t.subject}</div>
                        <div className={styles["web-adm-tkt__snippet"]}>
                          {t.message.length > 80 ? `${t.message.slice(0, 80)}…` : t.message}
                        </div>
                      </div>
                    </td>
                    <td className={`${styles["web-adm-tkt__td"]} ${styles["web-adm-tkt__thCenter"]}`}>
                      <Badge variant={sl.variant}>
                        {fa ? sl.fa : sl.en}
                      </Badge>
                    </td>
                    <td className={`${styles["web-adm-tkt__td"]} ${styles["web-adm-tkt__date"]}`}>
                      {formatRelativeTime(t.createdAt, fa ? "fa" : "en")}
                    </td>
                    <td className={styles["web-adm-tkt__td"]} style={{ textAlign: "end" }}>
                      <Link href={`/${locale}/admin/tickets/${t.id}`} className={styles["web-adm-tkt__viewBtn"]}>
                        {fa ? "مشاهده و پاسخ" : "View & Reply"}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles["web-adm-tkt__pagination"]}>
          {page > 1 && (
            <Link
              href={`/${locale}/admin/tickets?page=${page - 1}${
                statusFilter ? `&status=${statusFilter}` : ""
              }${sourceFilter ? `&source=${sourceFilter}` : ""}`}
              className={styles["web-adm-tkt__pageBtn"]}
            >
              {fa ? "قبلی" : "Previous"}
            </Link>
          )}
          <span className={styles["web-adm-tkt__pageInfo"]}>
            {fa ? `صفحه ${page} از ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
          {page < totalPages && (
            <Link
              href={`/${locale}/admin/tickets?page=${page + 1}${
                statusFilter ? `&status=${statusFilter}` : ""
              }${sourceFilter ? `&source=${sourceFilter}` : ""}`}
              className={styles["web-adm-tkt__pageBtn"]}
            >
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
