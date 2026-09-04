import { notFound } from "next/navigation"
import Link from "next/link"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { formatPrice, formatRelativeTime } from "@/lib/cement"
import OrderStatusForm from "./order-status-form"
type Props = { params: Promise<{ locale: string; id: string }> }
export const metadata: Metadata = { title: "جزئیات سفارش | پنل مدیریت تیراژه" }
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
const PAYMENT_STATUS_LABEL: Record<string, { fa: string; en: string; variant: string }> = {
  PENDING:    { fa: "در انتظار",  en: "Pending",    variant: "warning" },
  PROCESSING: { fa: "در حال پردازش", en: "Processing", variant: "info"    },
  COMPLETED:  { fa: "تکمیل شده", en: "Completed",  variant: "success" },
  FAILED:     { fa: "ناموفق",    en: "Failed",     variant: "danger"  },
  REFUNDED:   { fa: "مسترد",     en: "Refunded",   variant: "danger"  },
  EXPIRED:    { fa: "منقضی",     en: "Expired",    variant: "danger"  },
}
export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          product: { select: { nameFa: true, nameEn: true, slug: true } },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  })
  if (!order) notFound()
  const statusInfo = ORDER_STATUS_LABEL[order.status] ?? {
    fa: order.status, en: order.status, variant: "info",
  }
  const shippingAddress = order.shippingAddress as Record<string, string> | null
  const formattedDate = fa
    ? new Date(order.createdAt).toLocaleDateString("fa-IR", { dateStyle: "long" })
    : new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })
  return (
    <>
      <div className="aod-root">
        {/* Back + header */}
        <div className="aod-topbar">
          <Link href={`/${locale}/admin/orders`} className="aod-back">
            {fa ? "← سفارش‌ها" : "← Orders"}
          </Link>
        </div>
        <div className="aod-header">
          <div>
            <h1 className="aod-title">
              {fa
                ? `سفارش #${order.orderNumber.toLocaleString("fa-IR")}`
                : `Order #${order.orderNumber}`}
            </h1>
            <p className="aod-date">{formattedDate}</p>
          </div>
          <span className={`aod-status-badge aod-status-badge--${statusInfo.variant}`}>
            {fa ? statusInfo.fa : statusInfo.en}
          </span>
        </div>
        {/* Status update */}
        <div className="aod-card">
          <h2 className="aod-section">{fa ? "تغییر وضعیت" : "Update Status"}</h2>
          <OrderStatusForm orderId={order.id} currentStatus={order.status} fa={fa} />
        </div>
        <div className="aod-grid">
          {/* Customer */}
          <div className="aod-card">
            <h2 className="aod-section">{fa ? "مشتری" : "Customer"}</h2>
            <dl className="aod-dl">
              <div className="aod-dl__row">
                <dt>{fa ? "نام" : "Name"}</dt>
                <dd>{order.user.name}</dd>
              </div>
              {order.user.email && (
                <div className="aod-dl__row">
                  <dt>{fa ? "ایمیل" : "Email"}</dt>
                  <dd dir="ltr">{order.user.email}</dd>
                </div>
              )}
              {order.user.phone && (
                <div className="aod-dl__row">
                  <dt>{fa ? "تلفن" : "Phone"}</dt>
                  <dd dir="ltr">{order.user.phone}</dd>
                </div>
              )}
            </dl>
          </div>
          {/* Shipping address */}
          {shippingAddress && (
            <div className="aod-card">
              <h2 className="aod-section">{fa ? "آدرس تحویل" : "Shipping Address"}</h2>
              <address className="aod-address">
                {shippingAddress.name && <p className="aod-address__name">{shippingAddress.name}</p>}
                {shippingAddress.address && <p>{shippingAddress.address}</p>}
                {(shippingAddress.city || shippingAddress.province) && (
                  <p>{[shippingAddress.city, shippingAddress.province].filter(Boolean).join(" — ")}</p>
                )}
                {shippingAddress.postalCode && (
                  <p>{fa ? "کد پستی:" : "Postal:"} {shippingAddress.postalCode}</p>
                )}
                {shippingAddress.phone && (
                  <p dir="ltr">{shippingAddress.phone}</p>
                )}
              </address>
            </div>
          )}
        </div>
        {/* Order items */}
        <div className="aod-card">
          <h2 className="aod-section">{fa ? "اقلام سفارش" : "Order Items"}</h2>
          <div className="aod-table-wrap">
            <table className="aod-table">
              <thead>
                <tr>
                  <th scope="col">{fa ? "محصول" : "Product"}</th>
                  <th scope="col">{fa ? "تعداد" : "Qty"}</th>
                  <th scope="col">{fa ? "قیمت واحد" : "Unit Price"}</th>
                  <th scope="col">{fa ? "جمع" : "Total"}</th>
                </tr>
              </thead>
              <tbody>
                {(order.items as any[]).map((item) => {
                  const product = item.product
                  const name = product
                    ? (fa ? product.nameFa : (product.nameEn ?? product.nameFa))
                    : (fa ? "محصول حذف‌شده" : "Deleted product")
                  return (
                    <tr key={item.id}>
                      <td>
                        {product ? (
                          <Link
                            href={`/${locale}/admin/products/${product.id ?? item.productId}`}
                            className="aod-table__link"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="aod-table__deleted">{name}</span>
                        )}
                      </td>
                      <td className="aod-table__qty">{fa ? item.quantity.toLocaleString("fa-IR") : item.quantity}</td>
                      <td className="aod-table__price">{formatPrice(item.unitPrice, locale)}</td>
                      <td className="aod-table__total">{formatPrice(item.totalPrice, locale)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Totals */}
          <div className="aod-totals">
            <div className="aod-totals__row">
              <span>{fa ? "جمع کالاها" : "Subtotal"}</span>
              <span>{formatPrice(order.subtotal, locale)}</span>
            </div>
            <div className="aod-totals__row">
              <span>{fa ? "هزینه ارسال" : "Shipping"}</span>
              <span>{formatPrice(order.shippingCost, locale)}</span>
            </div>
            <div className="aod-totals__row aod-totals__row--total">
              <span>{fa ? "مجموع نهایی" : "Total"}</span>
              <span>{formatPrice(order.totalAmount, locale)}</span>
            </div>
          </div>
        </div>
        {/* Payments */}
        {(order.payments as any[]).length > 0 && (
          <div className="aod-card">
            <h2 className="aod-section">{fa ? "پرداخت‌ها" : "Payments"}</h2>
            <div className="aod-table-wrap">
              <table className="aod-table">
                <thead>
                  <tr>
                    <th scope="col">{fa ? "درگاه" : "Gateway"}</th>
                    <th scope="col">{fa ? "مبلغ" : "Amount"}</th>
                    <th scope="col">{fa ? "وضعیت" : "Status"}</th>
                    <th scope="col">{fa ? "تاریخ" : "Date"}</th>
                    <th scope="col">{fa ? "کد پیگیری" : "Ref"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.payments as any[]).map((pmt) => {
                    const pStatus = PAYMENT_STATUS_LABEL[pmt.status] ?? { fa: pmt.status, en: pmt.status, variant: "info" }
                    return (
                      <tr key={pmt.id}>
                        <td>{pmt.gateway}</td>
                        <td className="aod-table__price">{formatPrice(pmt.amount, locale)}</td>
                        <td>
                          <span className={`aod-status-badge aod-status-badge--${pStatus.variant}`}>
                            {fa ? pStatus.fa : pStatus.en}
                          </span>
                        </td>
                        <td className="aod-table__secondary aod-table__date">
                          {formatRelativeTime(pmt.createdAt, locale)}
                        </td>
                        <td className="aod-table__secondary" dir="ltr">
                          {pmt.gatewayRef ?? "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Event history */}
        {(order.events as any[]).length > 0 && (
          <div className="aod-card">
            <h2 className="aod-section">{fa ? "تاریخچه وضعیت" : "Status History"}</h2>
            <div className="aod-events">
              {(order.events as any[]).map((ev) => {
                const evStatus = ORDER_STATUS_LABEL[ev.status] ?? { fa: ev.status, en: ev.status, variant: "info" }
                return (
                  <div key={ev.id} className="aod-event">
                    <span className={`aod-status-badge aod-status-badge--${evStatus.variant}`}>
                      {fa ? evStatus.fa : evStatus.en}
                    </span>
                    <div className="aod-event__meta">
                      {ev.note && <p className="aod-event__note">{ev.note}</p>}
                      <p className="aod-event__who">
                        {ev.actor?.name ?? (fa ? "سیستم" : "System")}
                        {" · "}
                        {formatRelativeTime(ev.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* Admin note */}
        {order.adminNote && (
          <div className="aod-card aod-card--note">
            <h2 className="aod-section">{fa ? "یادداشت مدیر" : "Admin Note"}</h2>
            <p className="aod-note-text">{order.adminNote}</p>
          </div>
        )}
      </div>
      <style>{`
        .aod-root {
          max-width: 56rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-bottom: 2rem;
        }
        .aod-topbar { }
        .aod-back {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .aod-back:hover { color: var(--color-text); }
        .aod-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .aod-title {
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .aod-date {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
        }
        .aod-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) { .aod-grid { grid-template-columns: 1fr 1fr; } }
        .aod-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
        }
        .aod-card--note { border-color: var(--color-warning); background-color: var(--color-warning-subtle); }
        .aod-section {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 1rem;
        }
        .aod-dl { display: flex; flex-direction: column; gap: 0.5rem; }
        .aod-dl__row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
          font-size: 0.875rem;
        }
        .aod-dl__row dt { color: var(--color-text-muted); flex-shrink: 0; }
        .aod-dl__row dd { color: var(--color-text); font-weight: 500; text-align: end; }
        .aod-address {
          font-style: normal;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          line-height: 1.6;
        }
        .aod-address__name { font-weight: 700; color: var(--color-text); }
        .aod-table-wrap { overflow-x: auto; }
        .aod-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .aod-table thead th {
          padding: 0.5rem 0.75rem;
          text-align: start;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .aod-table tbody td {
          padding: 0.625rem 0.75rem;
          border-top: 1px solid var(--color-border-subtle);
          color: var(--color-text);
          white-space: nowrap;
        }
        .aod-table tbody tr:first-child td { border-top: none; }
        .aod-table__link { color: var(--color-accent); font-weight: 600; text-decoration: none; }
        .aod-table__link:hover { text-decoration: underline; }
        .aod-table__deleted { color: var(--color-text-muted); font-style: italic; }
        .aod-table__qty { font-variant-numeric: tabular-nums; }
        .aod-table__price { color: var(--color-text); font-variant-numeric: tabular-nums; }
        .aod-table__total { font-weight: 700; font-variant-numeric: tabular-nums; }
        .aod-table__secondary { color: var(--color-text-secondary); }
        .aod-table__date { font-variant-numeric: tabular-nums; }
        .aod-totals {
          border-top: 1px solid var(--color-border);
          margin-top: 1rem;
          padding-top: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .aod-totals__row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .aod-totals__row--total {
          font-size: 1rem;
          font-weight: 800;
          color: var(--color-text);
          padding-top: 0.375rem;
          border-top: 1px solid var(--color-border);
        }
        .aod-events { display: flex; flex-direction: column; gap: 0.75rem; }
        .aod-event {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .aod-event__meta { display: flex; flex-direction: column; gap: 0.15rem; }
        .aod-event__note {
          font-size: 0.875rem;
          color: var(--color-text);
        }
        .aod-event__who {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .aod-note-text {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .aod-status-badge { display: inline-flex; align-items: center; padding: 0.175rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; white-space: nowrap; }
        .aod-status-badge--success { background-color: var(--color-success-subtle); color: var(--color-success); }
        .aod-status-badge--warning { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .aod-status-badge--danger  { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .aod-status-badge--info    { background-color: var(--color-accent-subtle);  color: var(--color-accent);  }
      `}</style>
    </>
  )
}
