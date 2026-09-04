import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { formatPrice, formatRelativeTime } from "@/lib/cement"

export const metadata: Metadata = { title: "سفارش‌ها | پنل مدیریت تیراژه" }

const PAGE_SIZE = 20

const ORDER_STATUS_LABEL: Record<string, { fa: string; en: string; variant: string }> = {
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
    <>
      <div className="ao-header">
        <div>
          <h1 className="ao-title">{fa ? "سفارش‌ها" : "Orders"}</h1>
          <p className="ao-count">
            {fa ? `${total.toLocaleString("fa-IR")} سفارش` : `${total.toLocaleString()} orders`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" action={`/${locale}/admin/orders`} className="ao-filters">
        {/* Search */}
        <div className="ao-search-wrap">
          <Search
            style={{
              position: "absolute",
              insetInlineStart: "0.75rem",
              width: "0.9rem",
              height: "0.9rem",
              color: "var(--color-text-muted)",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={fa ? "شماره سفارش یا نام مشتری..." : "Order # or customer name..."}
            className="ao-search"
            aria-label={fa ? "جستجو" : "Search"}
          />
        </div>

        {/* Status filter */}
        <div className="ao-status-tabs" role="list">
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
                className={`ao-status-tab ${isActive ? "ao-status-tab--active" : ""}`}
              >
                {fa ? opt.fa : opt.en}
              </Link>
            )
          })}
        </div>
      </form>

      {/* Table */}
      <div className="ao-table-wrap">
        <table className="ao-table" role="table">
          <thead>
            <tr>
              <th scope="col">{fa ? "شماره سفارش" : "Order #"}</th>
              <th scope="col">{fa ? "مشتری" : "Customer"}</th>
              <th scope="col">{fa ? "وضعیت" : "Status"}</th>
              <th scope="col">{fa ? "مبلغ کل" : "Total"}</th>
              <th scope="col">{fa ? "تاریخ ثبت" : "Date"}</th>
              <th scope="col"><span className="ao-sr-only">{fa ? "عملیات" : "Actions"}</span></th>
            </tr>
          </thead>
          <tbody>
            {(orders as any[]).map((order) => {
              const statusInfo = ORDER_STATUS_LABEL[order.status as string] ?? {
                fa: order.status, en: order.status, variant: "info",
              }
              return (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className="ao-table__link"
                    >
                      #{fa
                        ? order.orderNumber.toLocaleString("fa-IR")
                        : order.orderNumber}
                    </Link>
                  </td>
                  <td className="ao-table__secondary">
                    <span className="ao-table__user-name">
                      {order.user?.name ?? "—"}
                    </span>
                    {order.user?.email && (
                      <span className="ao-table__user-email">{order.user.email}</span>
                    )}
                  </td>
                  <td>
                    <span className={`ao-status-badge ao-status-badge--${statusInfo.variant}`}>
                      {fa ? statusInfo.fa : statusInfo.en}
                    </span>
                  </td>
                  <td className="ao-table__price">
                    {formatPrice(order.totalAmount, locale)}
                  </td>
                  <td className="ao-table__secondary ao-table__date">
                    {formatRelativeTime(order.createdAt, locale)}
                  </td>
                  <td>
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className="ao-table__action"
                    >
                      {fa ? "جزئیات" : "View"}
                    </Link>
                  </td>
                </tr>
              )
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="ao-table__empty">
                  {fa ? "سفارشی یافت نشد" : "No orders found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ao-pagination">
          {page > 1 && (
            <Link href={buildUrl(page - 1)} className="ao-page-btn">
              {fa ? "قبلی" : "Prev"}
            </Link>
          )}
          <span className="ao-page-info">
            {fa
              ? `صفحه ${page.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}`
              : `Page ${page} of ${totalPages}`}
          </span>
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} className="ao-page-btn">
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}

      <style>{`
        .ao-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
        .ao-title { font-size: 1.5rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em; }
        .ao-count { font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.2rem; font-variant-numeric: tabular-nums; }

        .ao-filters { display: flex; flex-direction: column; gap: 0.875rem; margin-bottom: 1.25rem; }

        .ao-search-wrap { position: relative; display: flex; align-items: center; max-width: 28rem; }
        .ao-search {
          width: 100%;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 0.5625rem 0.875rem;
          padding-inline-start: 2.25rem;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color var(--transition-fast);
        }
        .ao-search::placeholder { color: var(--color-text-muted); }
        .ao-search:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-subtle); }

        .ao-status-tabs { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .ao-status-tab {
          padding: 0.3rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: background-color var(--transition-fast), color var(--transition-fast);
          white-space: nowrap;
        }
        .ao-status-tab:hover { background-color: var(--color-border-subtle); color: var(--color-text); }
        .ao-status-tab--active { background-color: var(--color-accent-subtle); color: var(--color-accent); font-weight: 700; }

        .ao-table-wrap {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow-x: auto;
          margin-bottom: 1.25rem;
        }
        .ao-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .ao-table thead th {
          padding: 0.75rem 1rem;
          text-align: start;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .ao-table tbody td { padding: 0.75rem 1rem; color: var(--color-text); border-top: 1px solid var(--color-border-subtle); white-space: nowrap; }
        .ao-table tbody tr:first-child td { border-top: none; }
        .ao-table tbody tr:hover td { background-color: var(--color-background); }
        .ao-table__link { color: var(--color-accent); font-weight: 700; text-decoration: none; }
        .ao-table__link:hover { text-decoration: underline; }
        .ao-table__secondary { color: var(--color-text-secondary); }
        .ao-table__user-name { display: block; font-weight: 500; color: var(--color-text); }
        .ao-table__user-email { display: block; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.1rem; }
        .ao-table__price { color: var(--color-text); font-variant-numeric: tabular-nums; }
        .ao-table__date { font-variant-numeric: tabular-nums; }
        .ao-table__action { color: var(--color-accent); font-weight: 600; font-size: 0.8125rem; text-decoration: none; }
        .ao-table__action:hover { text-decoration: underline; }
        .ao-table__empty { text-align: center; color: var(--color-text-muted); padding: 3rem !important; }

        .ao-status-badge { display: inline-flex; align-items: center; padding: 0.175rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; white-space: nowrap; }
        .ao-status-badge--success { background-color: var(--color-success-subtle); color: var(--color-success); }
        .ao-status-badge--warning { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .ao-status-badge--danger  { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .ao-status-badge--info    { background-color: var(--color-accent-subtle);  color: var(--color-accent);  }

        .ao-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; }
        .ao-page-btn { padding: 0.5rem 1rem; background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 600; color: var(--color-text-secondary); text-decoration: none; transition: background-color var(--transition-fast), border-color var(--transition-fast); }
        .ao-page-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .ao-page-info { font-size: 0.875rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
        .ao-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      `}</style>
    </>
  )
}
