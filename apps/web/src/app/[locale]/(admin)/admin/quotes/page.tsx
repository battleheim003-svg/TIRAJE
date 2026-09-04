import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { formatPrice, formatRelativeTime } from "@/lib/cement"

export const metadata: Metadata = { title: "درخواست‌های قیمت | پنل مدیریت تیراژه" }

const PAGE_SIZE = 25

const STATUS_LABEL = {
  PENDING:  { fa: "در انتظار",      en: "Pending",  variant: "warn"    },
  REVIEWED: { fa: "بررسی شده",     en: "Reviewed", variant: "info"    },
  QUOTED:   { fa: "قیمت داده شده", en: "Quoted",   variant: "success" },
  ACCEPTED: { fa: "پذیرفته شده",   en: "Accepted", variant: "success" },
  REJECTED: { fa: "رد شده",        en: "Rejected", variant: "danger"  },
} as const

const CUSTOMER_TYPE_LABEL = {
  NORMAL:     { fa: "عادی",      en: "Normal"     },
  CONTRACTOR: { fa: "پیمانکار", en: "Contractor" },
  COMPANY:    { fa: "شرکت",     en: "Company"    },
} as const

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminQuotesPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))
  const statusFilter = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? ""

  const where: Record<string, unknown> = {}
  if (statusFilter) where.status = statusFilter

  const [quotes, total] = await Promise.all([
    db.quoteRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        companyName: true,
        customerType: true,
        quantityTon: true,
        deliveryCity: true,
        status: true,
        quotedPrice: true,
        createdAt: true,
        product: { select: { nameFa: true, nameEn: true, slug: true } },
        handler: { select: { name: true } },
      },
    }),
    db.quoteRequest.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  type QuoteRow = (typeof quotes)[number]

  return (
    <>
      <div className="aq-root">
        <div className="aq-header">
          <div>
            <h1 className="aq-title">{fa ? "درخواست‌های قیمت" : "Quote Requests"}</h1>
            <p className="aq-sub">{fa ? `${total} درخواست` : `${total} requests`}</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="aq-filters">
          {[["", fa ? "همه" : "All"], ["PENDING", fa ? "در انتظار" : "Pending"], ["REVIEWED", fa ? "بررسی شده" : "Reviewed"], ["QUOTED", fa ? "قیمت داده شده" : "Quoted"], ["ACCEPTED", fa ? "پذیرفته" : "Accepted"], ["REJECTED", fa ? "رد شده" : "Rejected"]].map(([val, label]) => (
            <Link
              key={val}
              href={`/${locale}/admin/quotes${val ? `?status=${val}` : ""}`}
              className={`aq-filter${statusFilter === val ? " aq-filter--active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {quotes.length === 0 ? (
          <div className="aq-empty">
            <MessageSquare size={40} strokeWidth={1.5} />
            <p>{fa ? "هیچ درخواستی یافت نشد." : "No requests found."}</p>
          </div>
        ) : (
          <div className="aq-card">
            <table className="aq-table">
              <thead>
                <tr>
                  <th>{fa ? "درخواست‌دهنده" : "Requester"}</th>
                  <th>{fa ? "محصول" : "Product"}</th>
                  <th className="aq-th-center">{fa ? "مقدار (تن)" : "Qty (ton)"}</th>
                  <th>{fa ? "شهر تحویل" : "City"}</th>
                  <th className="aq-th-center">{fa ? "وضعیت" : "Status"}</th>
                  <th className="aq-th-center">{fa ? "قیمت پیشنهادی" : "Quoted Price"}</th>
                  <th>{fa ? "تاریخ" : "Date"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q: QuoteRow) => {
                  const sl = STATUS_LABEL[q.status as keyof typeof STATUS_LABEL] ?? { fa: q.status, en: q.status, variant: "muted" }
                  const ct = CUSTOMER_TYPE_LABEL[q.customerType as keyof typeof CUSTOMER_TYPE_LABEL]
                  return (
                    <tr key={q.id}>
                      <td className="aq-requester">
                        <span className="aq-name">{q.name}</span>
                        <span className="aq-phone">{q.phone}</span>
                        {q.companyName && <span className="aq-company">{q.companyName}</span>}
                        {ct && <span className="aq-ctype">{fa ? ct.fa : ct.en}</span>}
                      </td>
                      <td className="aq-product">
                        {fa ? q.product.nameFa : (q.product.nameEn ?? q.product.nameFa)}
                      </td>
                      <td className="aq-th-center aq-num">{Number(q.quantityTon).toLocaleString()}</td>
                      <td className="aq-muted">{q.deliveryCity ?? "—"}</td>
                      <td className="aq-th-center">
                        <span className={`aq-badge aq-badge--${sl.variant}`}>{fa ? sl.fa : sl.en}</span>
                      </td>
                      <td className="aq-th-center aq-num">
                        {q.quotedPrice != null ? formatPrice(Number(q.quotedPrice), fa ? "fa" : "en") : <span className="aq-muted">—</span>}
                      </td>
                      <td className="aq-date">{formatRelativeTime(q.createdAt, fa ? "fa" : "en")}</td>
                      <td className="aq-actions">
                        <Link href={`/${locale}/admin/quotes/${q.id}`} className="aq-link">{fa ? "مشاهده" : "View"}</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="aq-pager">
            {page > 1 && (
              <Link href={`/${locale}/admin/quotes?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`} className="aq-pager-btn">
                {fa ? "قبلی" : "Previous"}
              </Link>
            )}
            <span className="aq-pager-info">{fa ? `صفحه ${page} از ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
            {page < totalPages && (
              <Link href={`/${locale}/admin/quotes?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`} className="aq-pager-btn">
                {fa ? "بعدی" : "Next"}
              </Link>
            )}
          </div>
        )}
      </div>

      <style>{`
        .aq-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .aq-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
        .aq-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
        .aq-sub { font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.2rem; }
        .aq-filters { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .aq-filter { font-size: 0.8125rem; padding: 0.3125rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); color: var(--color-text-secondary); text-decoration: none; transition: border-color var(--transition-fast), color var(--transition-fast); }
        .aq-filter:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .aq-filter--active { border-color: var(--color-accent); color: var(--color-accent); background-color: color-mix(in srgb, var(--color-accent) 8%, transparent); }
        .aq-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; color: var(--color-text-muted); background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-align: center; }
        .aq-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; overflow-x: auto; }
        .aq-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .aq-table th { padding: 0.625rem 0.875rem; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); text-align: start; white-space: nowrap; }
        .aq-th-center { text-align: center !important; }
        .aq-table td { padding: 0.625rem 0.875rem; border-bottom: 1px solid var(--color-border); vertical-align: middle; color: var(--color-text); }
        .aq-table tbody tr:last-child td { border-bottom: none; }
        .aq-requester { display: flex; flex-direction: column; gap: 0.1rem; }
        .aq-name { font-weight: 500; }
        .aq-phone { font-size: 0.75rem; color: var(--color-text-muted); direction: ltr; }
        .aq-company { font-size: 0.75rem; color: var(--color-text-secondary); }
        .aq-ctype { font-size: 0.6875rem; color: var(--color-accent); }
        .aq-product { font-size: 0.875rem; max-width: 14rem; }
        .aq-muted { color: var(--color-text-muted); }
        .aq-num { font-variant-numeric: tabular-nums; }
        .aq-date { font-size: 0.8125rem; color: var(--color-text-muted); white-space: nowrap; }
        .aq-badge { display: inline-block; font-size: 0.6875rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 999px; }
        .aq-badge--success { color: var(--color-success); background-color: var(--color-success-subtle); }
        .aq-badge--warn { color: var(--color-warning, #b45309); background-color: var(--color-warning-subtle, #fef3c7); }
        .aq-badge--info { color: var(--color-info, #0369a1); background-color: var(--color-info-subtle, #e0f2fe); }
        .aq-badge--danger { color: var(--color-danger); background-color: var(--color-danger-subtle); }
        .aq-badge--muted { color: var(--color-text-muted); background-color: var(--color-border); }
        .aq-actions { white-space: nowrap; text-align: end; }
        .aq-link { font-size: 0.8125rem; color: var(--color-accent); text-decoration: none; }
        .aq-link:hover { text-decoration: underline; }
        .aq-pager { display: flex; align-items: center; justify-content: center; gap: 1rem; }
        .aq-pager-btn { font-size: 0.875rem; color: var(--color-accent); text-decoration: none; }
        .aq-pager-btn:hover { text-decoration: underline; }
        .aq-pager-info { font-size: 0.8125rem; color: var(--color-text-muted); }
      `}</style>
    </>
  )
}
