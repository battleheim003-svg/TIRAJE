import Link from "next/link"
import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { Package } from "lucide-react"
import { formatPrice } from "@/lib/cement"

export const metadata: Metadata = { title: "سفارش‌های من | تیراژه" }

const STATUS_MAP: Record<string, { fa: string; en: string; variant: string }> = {
  PENDING:          { fa: "در انتظار تأیید",   en: "Pending",    variant: "warning" },
  AWAITING_PAYMENT: { fa: "انتظار پرداخت",     en: "Awaiting Payment", variant: "warning" },
  CONFIRMED:        { fa: "تأیید شده",          en: "Confirmed",  variant: "info"    },
  PROCESSING:       { fa: "در حال پردازش",     en: "Processing", variant: "info"    },
  SHIPPED:          { fa: "ارسال شده",          en: "Shipped",    variant: "info"    },
  DELIVERED:        { fa: "تحویل داده شده",    en: "Delivered",  variant: "success" },
  CANCELLED:        { fa: "لغو شده",            en: "Cancelled",  variant: "danger"  },
  REFUNDED:         { fa: "مسترد شده",          en: "Refunded",   variant: "danger"  },
}

export default async function OrdersPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const session = await auth()
  if (!session?.user) redirect(`/${locale}/auth/login`)

  const orders: any[] = await db.order.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })

  return (
    <>
      <div className="myorders-root">
        <h1 className="myorders-title">{fa ? "سفارش‌های من" : "My Orders"}</h1>

        {orders.length === 0 ? (
          <div className="myorders-empty">
            <Package className="myorders-empty__icon" aria-hidden="true" />
            <p className="myorders-empty__msg">
              {fa ? "هنوز سفارشی ثبت نشده است." : "No orders yet."}
            </p>
            <Link href={`/${locale}/products`} className="myorders-empty__cta">
              {fa ? "شروع خرید" : "Start Shopping"}
            </Link>
          </div>
        ) : (
          <div className="myorders-list">
            {orders.map((order) => {
              const statusInfo = STATUS_MAP[order.status as string] ?? STATUS_MAP.PENDING!
              const date = new Date(order.createdAt)
              const formattedDate = fa
                ? date.toLocaleDateString("fa-IR")
                : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
              return (
                <Link
                  key={order.id}
                  href={`/${locale}/account/orders/${order.id}`}
                  className="myorders-card"
                >
                  <div className="myorders-card__meta">
                    <p className="myorders-card__num">
                      {fa
                        ? `سفارش شماره ${order.orderNumber.toLocaleString("fa-IR")}`
                        : `Order #${order.orderNumber}`}
                    </p>
                    <p className="myorders-card__date">{formattedDate}</p>
                    <p className="myorders-card__items">
                      {fa
                        ? `${order.items.length.toLocaleString("fa-IR")} کالا`
                        : `${order.items.length} item${order.items.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="myorders-card__aside">
                    <span className={`status-badge status-badge--${statusInfo.variant}`}>
                      {fa ? statusInfo.fa : statusInfo.en}
                    </span>
                    <p className="myorders-card__price">{formatPrice(order.totalAmount, locale)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .myorders-root {
          max-width: 48rem;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .myorders-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
        }

        .myorders-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 1rem;
          text-align: center;
          gap: 1rem;
        }
        .myorders-empty__icon {
          width: 3rem;
          height: 3rem;
          color: var(--color-text-muted);
          opacity: 0.4;
        }
        .myorders-empty__msg {
          font-size: 1.0625rem;
          color: var(--color-text-muted);
        }
        .myorders-empty__cta {
          display: inline-block;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.625rem 1.75rem;
          border-radius: var(--radius-lg);
          text-decoration: none;
          transition: background-color var(--transition-fast);
        }
        .myorders-empty__cta:hover { background-color: var(--color-accent-hover); }

        .myorders-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .myorders-card {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          text-decoration: none;
          color: inherit;
          transition: box-shadow var(--transition-base), border-color var(--transition-base);
        }
        .myorders-card:hover { box-shadow: var(--shadow-md); border-color: var(--color-accent); }

        .myorders-card__meta { display: flex; flex-direction: column; gap: 0.2rem; }
        .myorders-card__num {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .myorders-card__date {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .myorders-card__items {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-top: 0.1rem;
        }
        .myorders-card__aside {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .myorders-card__price {
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--color-accent);
          font-variant-numeric: tabular-nums;
        }

        .status-badge { display: inline-flex; align-items: center; padding: 0.175rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; white-space: nowrap; }
        .status-badge--success { background-color: var(--color-success-subtle); color: var(--color-success); }
        .status-badge--warning { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .status-badge--danger  { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .status-badge--info    { background-color: var(--color-accent-subtle);  color: var(--color-accent);  }
      `}</style>
    </>
  )
}
