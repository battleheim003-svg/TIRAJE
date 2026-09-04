import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { formatPrice, formatRelativeTime } from "@/lib/cement"
import QuoteUpdateForm from "./quote-update-form"
export const metadata: Metadata = { title: "جزئیات درخواست قیمت | پنل مدیریت تیراژه" }
const STATUS_LABEL = {
  PENDING:  { fa: "در انتظار",      en: "Pending",  variant: "warn"    },
  REVIEWED: { fa: "بررسی شده",     en: "Reviewed", variant: "info"    },
  QUOTED:   { fa: "قیمت داده شده", en: "Quoted",   variant: "success" },
  ACCEPTED: { fa: "پذیرفته شده",   en: "Accepted", variant: "success" },
  REJECTED: { fa: "رد شده",        en: "Rejected", variant: "danger"  },
} as const
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
  const sl = STATUS_LABEL[quote.status as keyof typeof STATUS_LABEL] ?? { fa: quote.status, en: quote.status, variant: "muted" }
  const ct = CUSTOMER_TYPE_LABEL[quote.customerType as keyof typeof CUSTOMER_TYPE_LABEL]
  return (
    <>
      <div className="aqd-root">
        <Link href={`/${locale}/admin/quotes`} className="aqd-back">
          <ChevronLeft style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
          {fa ? "بازگشت به درخواست‌ها" : "Back to Quotes"}
        </Link>
        <div className="aqd-header">
          <div>
            <h1 className="aqd-title">{fa ? "درخواست قیمت" : "Quote Request"}</h1>
            <p className="aqd-meta">{formatRelativeTime(quote.createdAt, fa ? "fa" : "en")}</p>
          </div>
          <span className={`aqd-badge aqd-badge--${sl.variant}`}>{fa ? sl.fa : sl.en}</span>
        </div>
        {/* Grid: requester info + product info */}
        <div className="aqd-grid">
          {/* Requester */}
          <div className="aqd-card">
            <h2 className="aqd-section-title">{fa ? "اطلاعات درخواست‌دهنده" : "Requester Info"}</h2>
            <dl className="aqd-dl">
              <dt>{fa ? "نام" : "Name"}</dt><dd>{quote.name}</dd>
              <dt>{fa ? "تلفن" : "Phone"}</dt><dd dir="ltr">{quote.phone}</dd>
              {quote.email && <><dt>{fa ? "ایمیل" : "Email"}</dt><dd dir="ltr">{quote.email}</dd></>}
              {quote.companyName && <><dt>{fa ? "شرکت" : "Company"}</dt><dd>{quote.companyName}</dd></>}
              <dt>{fa ? "نوع مشتری" : "Type"}</dt><dd>{ct ? (fa ? ct.fa : ct.en) : quote.customerType}</dd>
              {quote.user && <><dt>{fa ? "حساب کاربری" : "Account"}</dt><dd>{quote.user.name ?? quote.user.email}</dd></>}
            </dl>
          </div>
          {/* Request details */}
          <div className="aqd-card">
            <h2 className="aqd-section-title">{fa ? "جزئیات درخواست" : "Request Details"}</h2>
            <dl className="aqd-dl">
              <dt>{fa ? "محصول" : "Product"}</dt>
              <dd>
                <Link href={`/${locale}/admin/products/${quote.product.id}`} className="aqd-product-link">
                  {fa ? quote.product.nameFa : (quote.product.nameEn ?? quote.product.nameFa)}
                </Link>
              </dd>
              <dt>{fa ? "مقدار (تن)" : "Quantity (ton)"}</dt><dd>{Number(quote.quantityTon).toLocaleString()}</dd>
              {quote.deliveryCity && <><dt>{fa ? "شهر تحویل" : "Delivery City"}</dt><dd>{quote.deliveryCity}</dd></>}
              {quote.message && <><dt>{fa ? "پیام" : "Message"}</dt><dd className="aqd-message">{quote.message}</dd></>}
              {quote.quotedPrice != null && <><dt>{fa ? "قیمت پیشنهادی" : "Quoted Price"}</dt><dd className="aqd-price">{formatPrice(Number(quote.quotedPrice), fa ? "fa" : "en")}</dd></>}
              {quote.expiresAt && <><dt>{fa ? "انقضای پیشنهاد" : "Offer Expires"}</dt><dd>{new Date(quote.expiresAt).toLocaleDateString(fa ? "fa-IR" : "en-US")}</dd></>}
              {quote.handler && <><dt>{fa ? "مسئول رسیدگی" : "Handler"}</dt><dd>{quote.handler.name}</dd></>}
            </dl>
          </div>
        </div>
        {/* Admin note preview */}
        {quote.adminNote && (
          <div className="aqd-card aqd-note-card">
            <h2 className="aqd-section-title">{fa ? "یادداشت مدیریت" : "Admin Note"}</h2>
            <p className="aqd-note-text">{quote.adminNote}</p>
          </div>
        )}
        {/* Update form */}
        <div className="aqd-card">
          <h2 className="aqd-section-title">{fa ? "به‌روزرسانی درخواست" : "Update Request"}</h2>
          <QuoteUpdateForm
            quoteId={quote.id}
            currentStatus={quote.status}
            currentQuotedPrice={quote.quotedPrice != null ? Number(quote.quotedPrice) : null}
            currentAdminNote={quote.adminNote}
            fa={fa}
          />
        </div>
      </div>
      <style>{`
        .aqd-root { display: flex; flex-direction: column; gap: 1.25rem; max-width: 56rem; }
        .aqd-back { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none; width: fit-content; }
        .aqd-back:hover { color: var(--color-text); }
        .aqd-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
        .aqd-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
        .aqd-meta { font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.2rem; }
        .aqd-badge { display: inline-block; font-size: 0.8125rem; font-weight: 600; padding: 0.3rem 0.75rem; border-radius: 9999px; }
        .aqd-badge--success { color: var(--color-success); background-color: var(--color-success-subtle); }
        .aqd-badge--warn { color: var(--color-warning); background-color: var(--color-warning-subtle); }
        .aqd-badge--info { color: var(--color-info); background-color: var(--color-info-subtle); }
        .aqd-badge--danger { color: var(--color-danger); background-color: var(--color-danger-subtle); }
        .aqd-badge--muted { color: var(--color-text-muted); background-color: var(--color-border); }
        .aqd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
        .aqd-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; }
        .aqd-section-title { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin-bottom: 1rem; }
        .aqd-dl { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; font-size: 0.875rem; }
        .aqd-dl dt { color: var(--color-text-muted); white-space: nowrap; }
        .aqd-dl dd { color: var(--color-text); font-weight: 500; }
        .aqd-message { line-height: 1.6; white-space: pre-wrap; font-weight: 400 !important; }
        .aqd-price { color: var(--color-accent); font-weight: 700 !important; }
        .aqd-product-link { color: var(--color-accent); text-decoration: none; }
        .aqd-product-link:hover { text-decoration: underline; }
        .aqd-note-card { background-color: var(--color-warning-subtle); border-color: var(--color-warning); }
        .aqd-note-text { font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6; white-space: pre-wrap; }
      `}</style>
    </>
  )
}
