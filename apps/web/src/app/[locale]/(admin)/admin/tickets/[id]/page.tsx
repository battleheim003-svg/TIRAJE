import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Send, Globe, MessageSquare } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import { formatRelativeTime } from "@/lib/cement"
import TicketReplyForm from "./ticket-reply-form"
import styles from "./TicketDetail.module.css"

export const metadata: Metadata = { title: "جزئیات تیکت پشتیبانی | پنل مدیریت تیراژه" }

const STATUS_LABEL: Record<string, { fa: string; en: string; variant: "warning" | "info" | "success" }> = {
  UNREAD:  { fa: "خوانده‌نشده", en: "Unread",  variant: "warning" },
  READ:    { fa: "بررسی‌شده",   en: "Read",    variant: "info"    },
  REPLIED: { fa: "پاسخ‌داده‌شده", en: "Replied", variant: "success" },
}

const CATEGORY_LABEL: Record<string, { fa: string; en: string }> = {
  ACCOUNT_ISSUE:   { fa: "ورود / حساب کاربری", en: "Account Issue" },
  PRICE_INQUIRY:   { fa: "استعلام قیمت",       en: "Price Inquiry" },
  ORDER_ISSUE:     { fa: "پیگیری سفارش",       en: "Order Issue"   },
  PRODUCT_INQUIRY: { fa: "مشخصات محصول",       en: "Product Inquiry"},
  TECHNICAL_ISSUE: { fa: "مشکل فنی وبسایت",   en: "Technical Issue"},
  OTHER:           { fa: "سایر موارد",         en: "Other"         },
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminTicketDetailPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const ticket = await db.contact.findUnique({
    where: { id },
    include: {
      handler: { select: { name: true } },
    },
  })

  if (!ticket) notFound()

  const sl = STATUS_LABEL[ticket.status] ?? {
    fa: ticket.status,
    en: ticket.status,
    variant: "warning" as const,
  }
  const cat = ticket.category ? CATEGORY_LABEL[ticket.category] : null

  return (
    <div className={styles["web-adm-tkt-d__wrapper"]}>
      <Link href={`/${locale}/admin/tickets`} className={styles["web-adm-tkt-d__backLink"]}>
        <ChevronRight
          style={{
            width: "1rem",
            height: "1rem",
            transform: fa ? "rotate(0deg)" : "rotate(180deg)",
          }}
          aria-hidden="true"
        />
        {fa ? "بازگشت به لیست تیکت‌ها" : "Back to Tickets"}
      </Link>

      <div className={styles["web-adm-tkt-d__header"]}>
        <div>
          <h1 className={styles["web-adm-tkt-d__title"]}>
            {fa ? "تیکت پشتیبانی" : "Support Ticket"}
          </h1>
          <p className={styles["web-adm-tkt-d__meta"]}>{formatRelativeTime(ticket.createdAt, fa ? "fa" : "en")}</p>
        </div>
        <Badge variant={sl.variant}>
          {fa ? sl.fa : sl.en}
        </Badge>
      </div>

      {/* Grid: Sender Details + Ticket Body */}
      <div className={styles["web-adm-tkt-d__grid"]}>
        {/* Sender Info Card */}
        <div className={styles["web-adm-tkt-d__card"]}>
          <h2 className={styles["web-adm-tkt-d__sectionTitle"]}>{fa ? "اطلاعات فرستنده" : "Sender Details"}</h2>
          <dl className={styles["web-adm-tkt-d__dl"]}>
            <dt>{fa ? "نام" : "Name"}</dt>
            <dd>{ticket.name}</dd>

            <dt>{fa ? "منبع پیام" : "Source"}</dt>
            <dd>
              {ticket.source === "TELEGRAM" ? (
                <span className={`${styles["web-adm-tkt-d__source"]} ${styles["web-adm-tkt-d__source--tg"]}`}>
                  <Send style={{ width: "0.75rem", height: "0.75rem" }} aria-hidden="true" />
                  <span>{fa ? "ربات تلگرام" : "Telegram Bot"}</span>
                </span>
              ) : (
                <span className={`${styles["web-adm-tkt-d__source"]} ${styles["web-adm-tkt-d__source--web"]}`}>
                  <Globe style={{ width: "0.75rem", height: "0.75rem" }} aria-hidden="true" />
                  <span>{fa ? "فرم وبسایت" : "Website Form"}</span>
                </span>
              )}
            </dd>

            {ticket.telegramUsername && (
              <>
                <dt>{fa ? "نام کاربری تلگرام" : "Telegram @"}</dt>
                <dd dir="ltr">
                  <a
                    href={`https://t.me/${ticket.telegramUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#0284c7", textDecoration: "none", fontWeight: 600 }}
                  >
                    @{ticket.telegramUsername}
                  </a>
                </dd>
              </>
            )}

            {ticket.telegramChatId && (
              <>
                <dt>{fa ? "شناسه چت تلگرام" : "Telegram Chat ID"}</dt>
                <dd dir="ltr" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)" }}>
                  {ticket.telegramChatId}
                </dd>
              </>
            )}

            {ticket.phone && (
              <>
                <dt>{fa ? "شماره تماس" : "Phone"}</dt>
                <dd dir="ltr">{ticket.phone}</dd>
              </>
            )}

            {ticket.email && (
              <>
                <dt>{fa ? "ایمیل" : "Email"}</dt>
                <dd dir="ltr">{ticket.email}</dd>
              </>
            )}

            {ticket.handler && (
              <>
                <dt>{fa ? "مسئول پاسخگویی" : "Assigned Handler"}</dt>
                <dd>{ticket.handler.name}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Ticket Body Card */}
        <div className={styles["web-adm-tkt-d__card"]}>
          <h2 className={styles["web-adm-tkt-d__sectionTitle"]}>{fa ? "محتوای درخواست" : "Ticket Details"}</h2>
          <dl className={styles["web-adm-tkt-d__dl"]}>
            <dt>{fa ? "دسته‌بندی" : "Category"}</dt>
            <dd>{cat ? (fa ? cat.fa : cat.en) : <span>—</span>}</dd>

            <dt>{fa ? "موضوع" : "Subject"}</dt>
            <dd style={{ fontWeight: 600, color: "var(--color-accent-text)" }}>{ticket.subject}</dd>

            <dt>{fa ? "متن پیام" : "Message"}</dt>
            <dd style={{ gridColumn: "1 / -1" }}>
              <div className={styles["web-adm-tkt-d__messageBox"]}>
                <p className={styles["web-adm-tkt-d__message"]}>{ticket.message}</p>
              </div>
            </dd>
          </dl>
        </div>
      </div>

      {/* Existing Reply Card (if already replied) */}
      {ticket.replyText && (
        <div className={styles["web-adm-tkt-d__card"]} style={{ backgroundColor: "color-mix(in srgb, var(--color-success-500) 6%, var(--color-bg-elevated))", borderColor: "color-mix(in srgb, var(--color-success-500) 30%, var(--color-border))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <MessageSquare
                style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-success-500)" }}
                aria-hidden="true"
              />
              <h2 className={styles["web-adm-tkt-d__sectionTitle"]} style={{ margin: 0, border: "none", padding: 0 }}>
                {fa ? "پاسخ ارسال‌شده به کاربر" : "Previous Reply"}
              </h2>
            </div>
            {ticket.repliedAt && (
              <span className={styles["web-adm-tkt-d__meta"]}>
                {formatRelativeTime(ticket.repliedAt, fa ? "fa" : "en")}
                {ticket.handler && ` (${ticket.handler.name})`}
              </span>
            )}
          </div>
          <p className={styles["web-adm-tkt-d__message"]} style={{ backgroundColor: "var(--color-bg-elevated)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            {ticket.replyText}
          </p>
        </div>
      )}

      {/* Reply Form Card */}
      <div className={styles["web-adm-tkt-d__card"]}>
        <h2 className={styles["web-adm-tkt-d__sectionTitle"]}>
          {fa ? "ارسال پاسخ یا پیام جدید" : "Send or Update Reply"}
        </h2>
        <TicketReplyForm
          ticketId={ticket.id}
          currentStatus={ticket.status}
          currentReplyText={ticket.replyText}
          source={ticket.source}
          telegramChatId={ticket.telegramChatId}
          fa={fa}
        />
      </div>
    </div>
  )
}
