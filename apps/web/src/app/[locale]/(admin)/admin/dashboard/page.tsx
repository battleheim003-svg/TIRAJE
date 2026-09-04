import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { Package, ShoppingBag, Users, TrendingUp } from "lucide-react"
import { formatPrice, formatRelativeTime } from "@/lib/cement"
import Link from "next/link"

export const metadata: Metadata = { title: "داشبورد | پنل مدیریت تیراژه" }

const ORDER_STATUS_LABEL: Record<string, { fa: string; en: string; variant: string }> = {
  PENDING:          { fa: "در انتظار",      en: "Pending",          variant: "warning" },
  AWAITING_PAYMENT: { fa: "انتظار پرداخت", en: "Awaiting Payment",  variant: "warning" },
  CONFIRMED:        { fa: "تأیید شده",      en: "Confirmed",        variant: "info"    },
  PROCESSING:       { fa: "در حال پردازش", en: "Processing",        variant: "info"    },
  SHIPPED:          { fa: "ارسال شده",      en: "Shipped",          variant: "info"    },
  DELIVERED:        { fa: "تحویل داده شده", en: "Delivered",        variant: "success" },
  CANCELLED:        { fa: "لغو شده",        en: "Cancelled",        variant: "danger"  },
  REFUNDED:         { fa: "مسترد شده",      en: "Refunded",         variant: "danger"  },
}

export default async function DashboardPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const [
    productCount,
    orderCount,
    userCount,
    revenueResult,
    recentOrders,
    pendingOrderCount,
  ] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.order.count(),
    db.user.count({ where: { isActive: true } }),
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.order.count({ where: { status: "PENDING" } }),
  ])

  const revenue = revenueResult._sum.totalAmount ?? 0

  const stats = [
    {
      key: "products",
      fa: "محصولات فعال",
      en: "Active Products",
      value: productCount,
      icon: Package,
      href: `/${locale}/admin/products`,
      color: "accent",
    },
    {
      key: "orders",
      fa: "کل سفارش‌ها",
      en: "Total Orders",
      value: orderCount,
      icon: ShoppingBag,
      href: `/${locale}/admin/orders`,
      color: "info",
      badge: pendingOrderCount > 0 ? pendingOrderCount : null,
      badgeFa: "در انتظار",
      badgeEn: "pending",
    },
    {
      key: "users",
      fa: "کاربران فعال",
      en: "Active Users",
      value: userCount,
      icon: Users,
      href: `/${locale}/admin/users`,
      color: "success",
    },
    {
      key: "revenue",
      fa: "درآمد تأیید شده",
      en: "Confirmed Revenue",
      value: null,
      rawValue: formatPrice(revenue, locale),
      icon: TrendingUp,
      href: `/${locale}/admin/orders`,
      color: "warning",
    },
  ]

  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">{fa ? "داشبورد" : "Dashboard"}</h1>
        <p className="dash-sub">
          {fa ? "خلاصه وضعیت فروشگاه" : "Store overview"}
        </p>
      </div>

      {/* Stats tiles */}
      <div className="dash-stats">
        {stats.map((stat) => {
          const Icon = stat.icon
          const displayValue =
            stat.rawValue ??
            (fa ? stat.value?.toLocaleString("fa-IR") : stat.value?.toLocaleString())
          return (
            <Link key={stat.key} href={stat.href} className={`stat-card stat-card--${stat.color}`}>
              <div className="stat-card__icon-wrap">
                <Icon style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
              </div>
              <div className="stat-card__body">
                <p className="stat-card__label">{fa ? stat.fa : stat.en}</p>
                <p className="stat-card__value tabular">{displayValue}</p>
                {stat.badge != null && (
                  <p className="stat-card__badge">
                    {fa
                      ? `${stat.badge.toLocaleString("fa-IR")} ${stat.badgeFa}`
                      : `${stat.badge} ${stat.badgeEn}`}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent orders */}
      <section className="dash-section" aria-labelledby="recent-orders-heading">
        <div className="dash-section__head">
          <h2 id="recent-orders-heading" className="dash-section__title">
            {fa ? "سفارش‌های اخیر" : "Recent Orders"}
          </h2>
          <Link href={`/${locale}/admin/orders`} className="dash-section__link">
            {fa ? "مشاهده همه" : "View all"}
          </Link>
        </div>

        <div className="dash-table-wrap">
          <table className="dash-table" role="table">
            <thead>
              <tr>
                <th scope="col">{fa ? "شماره سفارش" : "Order #"}</th>
                <th scope="col">{fa ? "مشتری" : "Customer"}</th>
                <th scope="col">{fa ? "وضعیت" : "Status"}</th>
                <th scope="col">{fa ? "مبلغ" : "Amount"}</th>
                <th scope="col">{fa ? "تاریخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders as any[]).map((order) => {
                const statusInfo = ORDER_STATUS_LABEL[order.status as string] ?? {
                  fa: order.status,
                  en: order.status,
                  variant: "info",
                }
                return (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/${locale}/admin/orders/${order.id}`}
                        className="dash-table__link"
                      >
                        #{fa
                          ? order.orderNumber.toLocaleString("fa-IR")
                          : order.orderNumber}
                      </Link>
                    </td>
                    <td className="dash-table__secondary">
                      {order.user?.name ?? order.user?.email ?? "—"}
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${statusInfo.variant}`}>
                        {fa ? statusInfo.fa : statusInfo.en}
                      </span>
                    </td>
                    <td className="tabular">
                      {formatPrice(order.totalAmount, locale)}
                    </td>
                    <td className="dash-table__secondary tabular">
                      {formatRelativeTime(order.createdAt, locale)}
                    </td>
                  </tr>
                )
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="dash-table__empty">
                    {fa ? "سفارشی ثبت نشده است" : "No orders yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .dash-header {
          margin-bottom: 1.75rem;
        }
        .dash-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .dash-sub {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
        }

        /* stat cards */
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (min-width: 1024px) { .dash-stats { grid-template-columns: repeat(4, 1fr); } }

        .stat-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          text-decoration: none;
          color: inherit;
          transition: box-shadow var(--transition-base), transform var(--transition-base);
        }
        .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .stat-card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

        .stat-card__icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: var(--radius-lg);
          flex-shrink: 0;
        }
        .stat-card--accent .stat-card__icon-wrap { background-color: var(--color-accent-subtle); color: var(--color-accent); }
        .stat-card--info   .stat-card__icon-wrap { background-color: #dbeafe; color: #1d4ed8; }
        .stat-card--success .stat-card__icon-wrap { background-color: var(--color-success-subtle); color: var(--color-success); }
        .stat-card--warning .stat-card__icon-wrap { background-color: var(--color-warning-subtle); color: var(--color-warning); }

        .stat-card__body { min-width: 0; }
        .stat-card__label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stat-card__value {
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--color-text);
          margin-top: 0.25rem;
          line-height: 1.2;
        }
        .stat-card__badge {
          font-size: 0.6875rem;
          color: var(--color-warning);
          font-weight: 600;
          margin-top: 0.2rem;
        }

        /* recent orders section */
        .dash-section { display: flex; flex-direction: column; gap: 1rem; }
        .dash-section__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dash-section__title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--color-text);
        }
        .dash-section__link {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-accent);
          text-decoration: none;
          transition: opacity var(--transition-fast);
        }
        .dash-section__link:hover { opacity: 0.75; }

        /* table */
        .dash-table-wrap {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow-x: auto;
        }
        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .dash-table thead th {
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
        .dash-table tbody td {
          padding: 0.75rem 1rem;
          color: var(--color-text);
          border-top: 1px solid var(--color-border-subtle);
          white-space: nowrap;
        }
        .dash-table tbody tr:first-child td { border-top: none; }
        .dash-table__link {
          color: var(--color-accent);
          font-weight: 600;
          text-decoration: none;
        }
        .dash-table__link:hover { text-decoration: underline; }
        .dash-table__secondary { color: var(--color-text-secondary); }
        .dash-table__empty {
          text-align: center;
          color: var(--color-text-muted);
          padding: 2rem !important;
        }

        /* status badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.175rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .status-badge--success { background-color: var(--color-success-subtle); color: var(--color-success); }
        .status-badge--warning { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .status-badge--danger  { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .status-badge--info    { background-color: var(--color-accent-subtle);  color: var(--color-accent);  }

        .tabular { font-variant-numeric: tabular-nums; }
      `}</style>
    </>
  )
}
