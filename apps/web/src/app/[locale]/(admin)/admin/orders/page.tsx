import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import { formatPrice, formatRelativeTime } from "@/lib/cement"
import styles from "./Orders.module.css"

export const metadata: Metadata = { title: "سفارش‌ها | پنل مدیریت تیراژه" }

const PAGE_SIZE = 20

const ORDER_STATUS_LABEL: Record<string, { fa: string; en: string; variant: "warning" | "info" | "success" | "danger" }> = {
  PENDING:          { fa: "در انتظار",       en: "Pending",          variant: "warning" },
  AWAITING_PAYMENT: { fa: "انتظار پرداخت",  en: "Awaiting Payment", variant: "warning" },
  CONFIRMED:        { fa: "تأیید شده",       en: "Confirmed",        variant: "info"    },
  PROCESSING:       { fa: "در حال پردازش",  en: "Processing",       variant: "info"    },
  SHIPPED:          { fa: "ارسال شده",       en: "Shipped",          variant: "info"    },
  DELIVERED:        { fa: "تحویل داده شده",  en: "Delivered",        variant: "success" },
  CANCELLED:        { fa: "لغو شده",         en: "Cancelled",        variant: "danger"  },
  REFUNDED:         { fa: "مسترد شده",       en: "Refunded",         variant: "danger"  },
}

const STATUS_FILTER_OPTIONS = [
  { value: "",                 fa: "همه",             en: "All"             },
  { value: "PENDING",          fa: "در انتظار",       en: "Pending"         },
  { value: "CONFIRMED",        fa: "تأیید شده",       en: "Confirmed"       },
  { value: "PROCESSING",       fa: "در حال پردازش",  en: "Processing"      },
  { value: "SHIPPED",          fa: "ارسال شده",       en: "Shipped"         },
  { value: "DELIVERED",        fa: "تحویل داده شده",  en: "Delivered"       },
  { value: "CANCELLED",        fa: "لغو شده",         en: "Cancelled"       },
]

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminOrdersPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams

  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? ""
  const statusFilter = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? ""
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))

  const where: Record<string, unknown> = {}
  if (statusFilter) where.status = statusFilter
  if (q) {
    const num = parseInt(q, 10)
    if (!isNaN(num)) {
      where.orderNumber = num
    } else {
      where.user = { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
    }
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (statusFilter) params.set("status", statusFilter)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/${locale}/admin/orders${qs ? `?${qs}` : ""}`
  }

  return (
    <div className={styles["web-adm-ords__wrapper"]}>
      <div className={styles["web-adm-ords__header"]}>
        <div>
          <h1 className={styles["web-adm-ords__title"]}>{fa ? "سفارش‌ها" : "Orders"}</h1>
          <p className={styles["web-adm-ords__count"]}>
            {fa ? `${total.toLocaleString("fa-IR")} سفارش` : `${total.toLocaleString()} orders`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" action={`/${locale}/admin/orders`} className={styles["web-adm-ords__filters"]}>
        {/* Search */}
        <div className={styles["web-adm-ords__searchWrap"]}>
          <Search
            style={{
              width: "0.9rem",
              height: "0.9rem",
            }}
            className={styles["web-adm-ords__searchIcon"]}
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={fa ? "شماره سفارش یا نام مشتری..." : "Order # or customer name..."}
            className={styles["web-adm-ords__searchInput"]}
            aria-label={fa ? "جستجو" : "Search"}
          />
        </div>

        {/* Status filter */}
        <div className={styles["web-adm-ords__statusTabs"]} role="list">
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value
            const href = (() => {
              const params = new URLSearchParams()
              if (q) params.set("q", q)
              if (opt.value) params.set("status", opt.value)
              const qs = params.toString()
              return `/${locale}/admin/orders${qs ? `?${qs}` : ""}`
            })()
            return (
              <Link
                key={opt.value || "all"}
                href={href}
                role="listitem"
                aria-current={isActive ? "page" : undefined}
                className={`${styles["web-adm-ords__statusTab"]} ${isActive ? styles["web-adm-ords__statusTab--active"] : ""}`}
              >
                {fa ? opt.fa : opt.en}
              </Link>
            )
          })}
        </div>
      </form>

      {/* Table */}
      <div className={styles["web-adm-ords__tableWrap"]}>
        <table className={styles["web-adm-ords__table"]} role="table">
          <thead>
            <tr>
              <th scope="col" className={styles["web-adm-ords__th"]}>{fa ? "شماره سفارش" : "Order #"}</th>
              <th scope="col" className={styles["web-adm-ords__th"]}>{fa ? "مشتری" : "Customer"}</th>
              <th scope="col" className={styles["web-adm-ords__th"]}>{fa ? "وضعیت" : "Status"}</th>
              <th scope="col" className={styles["web-adm-ords__th"]}>{fa ? "مبلغ کل" : "Total"}</th>
              <th scope="col" className={styles["web-adm-ords__th"]}>{fa ? "تاریخ ثبت" : "Date"}</th>
              <th scope="col" className={styles["web-adm-ords__th"]}><span>{fa ? "عملیات" : "Actions"}</span></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusInfo = ORDER_STATUS_LABEL[order.status] ?? {
                fa: order.status, en: order.status, variant: "info" as const,
              }
              return (
                <tr key={order.id} className={styles["web-adm-ords__row"]}>
                  <td className={styles["web-adm-ords__td"]}>
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className={styles["web-adm-ords__orderLink"]}
                    >
                      #{fa
                        ? order.orderNumber.toLocaleString("fa-IR")
                        : order.orderNumber}
                    </Link>
                  </td>
                  <td className={styles["web-adm-ords__td"]}>
                    <div className={styles["web-adm-ords__userCell"]}>
                      <span className={styles["web-adm-ords__userName"]}>
                        {order.user?.name ?? "—"}
                      </span>
                      {order.user?.email && (
                        <span className={styles["web-adm-ords__userEmail"]}>{order.user.email}</span>
                      )}
                    </div>
                  </td>
                  <td className={styles["web-adm-ords__td"]}>
                    <Badge variant={statusInfo.variant}>
                      {fa ? statusInfo.fa : statusInfo.en}
                    </Badge>
                  </td>
                  <td className={`${styles["web-adm-ords__td"]} ${styles["web-adm-ords__price"]}`}>
                    {formatPrice(Number(order.totalAmount), locale)}
                  </td>
                  <td className={`${styles["web-adm-ords__td"]} ${styles["web-adm-ords__date"]}`}>
                    {formatRelativeTime(order.createdAt, locale)}
                  </td>
                  <td className={styles["web-adm-ords__td"]}>
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className={styles["web-adm-ords__viewBtn"]}
                    >
                      {fa ? "جزئیات" : "View"}
                    </Link>
                  </td>
                </tr>
              )
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className={styles["web-adm-ords__empty"]}>
                  {fa ? "سفارشی یافت نشد" : "No orders found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles["web-adm-ords__pagination"]}>
          {page > 1 && (
            <Link href={buildUrl(page - 1)} className={styles["web-adm-ords__pageBtn"]}>
              {fa ? "قبلی" : "Prev"}
            </Link>
          )}
          <span className={styles["web-adm-ords__pageInfo"]}>
            {fa
              ? `صفحه ${page.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}`
              : `Page ${page} of ${totalPages}`}
          </span>
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} className={styles["web-adm-ords__pageBtn"]}>
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
