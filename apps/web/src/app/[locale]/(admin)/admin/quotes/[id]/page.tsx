import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import { formatToman, formatRelativeTime } from "@/lib/cement"
import QuoteUpdateForm from "./quote-update-form"
import styles from "./QuoteDetail.module.css"

export const metadata: Metadata = { title: "جزئیات درخواست قیمت | پنل مدیریت تیراژه" }

const STATUS_LABEL: Record<string, { fa: string; en: string; variant: "warning" | "info" | "success" | "danger" | "neutral" }> = {
  PENDING:  { fa: "در انتظار",      en: "Pending",  variant: "warning" },
  REVIEWED: { fa: "بررسی شده",     en: "Reviewed", variant: "info"    },
  QUOTED:   { fa: "قیمت داده شده", en: "Quoted",   variant: "success" },
  ACCEPTED: { fa: "پذیرفته شده",   en: "Accepted", variant: "success" },
  REJECTED: { fa: "رد شده",        en: "Rejected", variant: "danger"  },
}

const CUSTOMER_TYPE_LABEL = {
  NORMAL:     { fa: "مشتری عادی", en: "Normal"     },
  CONTRACTOR: { fa: "پیمانکار",  en: "Contractor" },
  COMPANY:    { fa: "شرکت",      en: "Company"    },
} as const

type Props = { params: Promise<{ id: string }> }

export default async function AdminQuoteDetailPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const quote = await db.quoteRequest.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, nameFa: true, nameEn: true, slug: true } },
      user: { select: { name: true, email: true } },
      handler: { select: { name: true } },
    },
  })

  if (!quote) notFound()

  const sl = STATUS_LABEL[quote.status] ?? { fa: quote.status, en: quote.status, variant: "secondary" as const }
  const ct = CUSTOMER_TYPE_LABEL[quote.customerType as keyof typeof CUSTOMER_TYPE_LABEL]

  return (
    <div className={styles["web-adm-qt-d__wrapper"]}>
      <Link href={`/${locale}/admin/quotes`} className={styles["web-adm-qt-d__backLink"]}>
        <ChevronRight
          style={{
            width: "1rem",
            height: "1rem",
            transform: fa ? "rotate(0deg)" : "rotate(180deg)",
          }}
          aria-hidden="true"
        />
        {fa ? "بازگشت به درخواست‌ها" : "Back to Quotes"}
      </Link>

      <div className={styles["web-adm-qt-d__header"]}>
        <div>
          <h1 className={styles["web-adm-qt-d__title"]}>{fa ? "درخواست قیمت" : "Quote Request"}</h1>
          <p className={styles["web-adm-qt-d__meta"]}>{formatRelativeTime(quote.createdAt, fa ? "fa" : "en")}</p>
        </div>
        <Badge variant={sl.variant}>
          {fa ? sl.fa : sl.en}
        </Badge>
      </div>

      {/* Grid: requester info + product info */}
      <div className={styles["web-adm-qt-d__grid"]}>
        {/* Requester */}
        <div className={styles["web-adm-qt-d__card"]}>
          <h2 className={styles["web-adm-qt-d__sectionTitle"]}>{fa ? "اطلاعات درخواست‌دهنده" : "Requester Info"}</h2>
          <dl className={styles["web-adm-qt-d__dl"]}>
            <dt>{fa ? "نام" : "Name"}</dt><dd>{quote.name}</dd>
            <dt>{fa ? "تلفن" : "Phone"}</dt><dd dir="ltr">{quote.phone}</dd>
            {quote.email && <><dt>{fa ? "ایمیل" : "Email"}</dt><dd dir="ltr">{quote.email}</dd></>}
            {quote.companyName && <><dt>{fa ? "شرکت" : "Company"}</dt><dd>{quote.companyName}</dd></>}
            <dt>{fa ? "نوع مشتری" : "Type"}</dt><dd>{ct ? (fa ? ct.fa : ct.en) : quote.customerType}</dd>
            {quote.user && <><dt>{fa ? "حساب کاربری" : "Account"}</dt><dd>{quote.user.name ?? quote.user.email}</dd></>}
          </dl>
        </div>

        {/* Request details */}
        <div className={styles["web-adm-qt-d__card"]}>
          <h2 className={styles["web-adm-qt-d__sectionTitle"]}>{fa ? "جزئیات درخواست" : "Request Details"}</h2>
          <dl className={styles["web-adm-qt-d__dl"]}>
            <dt>{fa ? "محصول" : "Product"}</dt>
            <dd>
              <Link href={`/${locale}/admin/products/${quote.product.id}`} className={styles["web-adm-qt-d__productLink"]}>
                {fa ? quote.product.nameFa : (quote.product.nameEn ?? quote.product.nameFa)}
              </Link>
            </dd>
            <dt>{fa ? "مقدار (تن)" : "Quantity (ton)"}</dt><dd style={{ fontVariantNumeric: "tabular-nums" }}>{Number(quote.quantityTon).toLocaleString()}</dd>
            {quote.deliveryCity && <><dt>{fa ? "شهر تحویل" : "Delivery City"}</dt><dd>{quote.deliveryCity}</dd></>}
            {quote.message && <><dt>{fa ? "پیام" : "Message"}</dt><dd className={styles["web-adm-qt-d__message"]}>{quote.message}</dd></>}
            {quote.quotedPrice != null && <><dt>{fa ? "قیمت پیشنهادی" : "Quoted Price"}</dt><dd className={styles["web-adm-qt-d__price"]}>{formatToman(Number(quote.quotedPrice), fa ? "fa" : "en")}</dd></>}
            {quote.expiresAt && <><dt>{fa ? "انقضای پیشنهاد" : "Offer Expires"}</dt><dd>{new Date(quote.expiresAt).toLocaleDateString(fa ? "fa-IR" : "en-US")}</dd></>}
            {quote.handler && <><dt>{fa ? "مسئول رسیدگی" : "Handler"}</dt><dd>{quote.handler.name}</dd></>}
          </dl>
        </div>
      </div>

      {/* Admin note preview */}
      {quote.adminNote && (
        <div className={`${styles["web-adm-qt-d__card"]} ${styles["web-adm-qt-d__noteCard"]}`}>
          <h2 className={styles["web-adm-qt-d__sectionTitle"]}>{fa ? "یادداشت مدیریت" : "Admin Note"}</h2>
          <p className={styles["web-adm-qt-d__noteText"]}>{quote.adminNote}</p>
        </div>
      )}

      {/* Update form */}
      <div className={styles["web-adm-qt-d__card"]}>
        <h2 className={styles["web-adm-qt-d__sectionTitle"]}>{fa ? "به‌روزرسانی درخواست" : "Update Request"}</h2>
        <QuoteUpdateForm
          quoteId={quote.id}
          currentStatus={quote.status}
          currentQuotedPrice={quote.quotedPrice != null ? Number(quote.quotedPrice) : null}
          currentAdminNote={quote.adminNote}
          fa={fa}
        />
      </div>
    </div>
  )
}
