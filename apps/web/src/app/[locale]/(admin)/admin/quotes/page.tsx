import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import { formatToman, formatRelativeTime } from "@/lib/cement"
import styles from "./QuotesList.module.css"

export const metadata: Metadata = { title: "درخواست‌های قیمت | پنل مدیریت تیراژه" }

const PAGE_SIZE = 25

const STATUS_LABEL: Record<string, { fa: string; en: string; variant: "warning" | "info" | "success" | "danger" | "neutral" }> = {
  PENDING:  { fa: "در انتظار",      en: "Pending",  variant: "warning" },
  REVIEWED: { fa: "بررسی شده",     en: "Reviewed", variant: "info"    },
  QUOTED:   { fa: "قیمت داده شده", en: "Quoted",   variant: "success" },
  ACCEPTED: { fa: "پذیرفته شده",   en: "Accepted", variant: "success" },
  REJECTED: { fa: "رد شده",        en: "Rejected", variant: "danger"  },
}

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
    <div className={styles["web-adm-qt__wrapper"]}>
      <div className={styles["web-adm-qt__header"]}>
        <div>
          <h1 className={styles["web-adm-qt__title"]}>{fa ? "درخواست‌های قیمت" : "Quote Requests"}</h1>
          <p className={styles["web-adm-qt__count"]}>{fa ? `${total} درخواست` : `${total} requests`}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className={styles["web-adm-qt__filters"]}>
        {[["", fa ? "همه" : "All"], ["PENDING", fa ? "در انتظار" : "Pending"], ["REVIEWED", fa ? "بررسی شده" : "Reviewed"], ["QUOTED", fa ? "قیمت داده شده" : "Quoted"], ["ACCEPTED", fa ? "پذیرفته" : "Accepted"], ["REJECTED", fa ? "رد شده" : "Rejected"]].map(([val, label]) => (
          <Link
            key={val}
            href={`/${locale}/admin/quotes${val ? `?status=${val}` : ""}`}
            className={`${styles["web-adm-qt__filterTab"]}${statusFilter === val ? ` ${styles["web-adm-qt__filterTab--active"]}` : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {quotes.length === 0 ? (
        <div className={styles["web-adm-qt__empty"]}>
          <MessageSquare style={{ width: "2.5rem", height: "2.5rem" }} strokeWidth={1.5} aria-hidden="true" />
          <p>{fa ? "هیچ درخواستی یافت نشد." : "No requests found."}</p>
        </div>
      ) : (
        <div className={styles["web-adm-qt__tableWrap"]}>
          <table className={styles["web-adm-qt__table"]}>
            <thead>
              <tr>
                <th className={styles["web-adm-qt__th"]}>{fa ? "درخواست‌دهنده" : "Requester"}</th>
                <th className={styles["web-adm-qt__th"]}>{fa ? "محصول" : "Product"}</th>
                <th className={`${styles["web-adm-qt__th"]} ${styles["web-adm-qt__thCenter"]}`}>{fa ? "مقدار (تن)" : "Qty (ton)"}</th>
                <th className={styles["web-adm-qt__th"]}>{fa ? "شهر تحویل" : "City"}</th>
                <th className={`${styles["web-adm-qt__th"]} ${styles["web-adm-qt__thCenter"]}`}>{fa ? "وضعیت" : "Status"}</th>
                <th className={`${styles["web-adm-qt__th"]} ${styles["web-adm-qt__thCenter"]}`}>{fa ? "قیمت پیشنهادی" : "Quoted Price"}</th>
                <th className={styles["web-adm-qt__th"]}>{fa ? "تاریخ" : "Date"}</th>
                <th className={styles["web-adm-qt__th"]}></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: QuoteRow) => {
                const sl = STATUS_LABEL[q.status] ?? { fa: q.status, en: q.status, variant: "secondary" as const }
                const ct = CUSTOMER_TYPE_LABEL[q.customerType as keyof typeof CUSTOMER_TYPE_LABEL]
                return (
                  <tr key={q.id} className={styles["web-adm-qt__row"]}>
                    <td className={styles["web-adm-qt__td"]}>
                      <div className={styles["web-adm-qt__requester"]}>
                        <span className={styles["web-adm-qt__name"]}>{q.name}</span>
                        <span className={styles["web-adm-qt__phone"]}>{q.phone}</span>
                        {q.companyName && <span className={styles["web-adm-qt__company"]}>{q.companyName}</span>}
                        {ct && <span className={styles["web-adm-qt__ctype"]}>{fa ? ct.fa : ct.en}</span>}
                      </div>
                    </td>
                    <td className={styles["web-adm-qt__td"]}>
                      <span className={styles["web-adm-qt__product"]}>{fa ? q.product.nameFa : (q.product.nameEn ?? q.product.nameFa)}</span>
                    </td>
                    <td className={`${styles["web-adm-qt__td"]} ${styles["web-adm-qt__num"]}`}>{Number(q.quantityTon).toLocaleString()}</td>
                    <td className={`${styles["web-adm-qt__td"]} ${styles["web-adm-qt__muted"]}`}>{q.deliveryCity ?? "—"}</td>
                    <td className={`${styles["web-adm-qt__td"]} ${styles["web-adm-qt__thCenter"]}`}>
                      <Badge variant={sl.variant}>
                        {fa ? sl.fa : sl.en}
                      </Badge>
                    </td>
                    <td className={`${styles["web-adm-qt__td"]} ${styles["web-adm-qt__num"]}`}>
                      {q.quotedPrice != null ? formatToman(Number(q.quotedPrice), fa ? "fa" : "en") : <span className={styles["web-adm-qt__muted"]}>—</span>}
                    </td>
                    <td className={`${styles["web-adm-qt__td"]} ${styles["web-adm-qt__date"]}`}>{formatRelativeTime(q.createdAt, fa ? "fa" : "en")}</td>
                    <td className={styles["web-adm-qt__td"]} style={{ textAlign: "end" }}>
                      <Link href={`/${locale}/admin/quotes/${q.id}`} className={styles["web-adm-qt__viewBtn"]}>{fa ? "مشاهده" : "View"}</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles["web-adm-qt__pagination"]}>
          {page > 1 && (
            <Link href={`/${locale}/admin/quotes?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`} className={styles["web-adm-qt__pageBtn"]}>
              {fa ? "قبلی" : "Previous"}
            </Link>
          )}
          <span className={styles["web-adm-qt__pageInfo"]}>{fa ? `صفحه ${page} از ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
          {page < totalPages && (
            <Link href={`/${locale}/admin/quotes?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`} className={styles["web-adm-qt__pageBtn"]}>
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
