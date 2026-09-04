import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { formatPrice } from "@/lib/cement"

type Props = { params: Promise<{ locale: string; id: string }> }

export const metadata: Metadata = { title: "جزئیات سفارش | تیراژه" }

const STATUS_STEPS = [
  { key: "PENDING",    fa: "ثبت سفارش", en: "Order Placed" },
  { key: "CONFIRMED",  fa: "تأیید شده",  en: "Confirmed"   },
  { key: "PROCESSING", fa: "پردازش",     en: "Processing"  },
  { key: "SHIPPED",    fa: "ارسال",      en: "Shipped"     },
  { key: "DELIVERED",  fa: "تحویل",      en: "Delivered"   },
]

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

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const session = await auth()
  if (!session?.user) redirect(`/${locale}/auth/login`)

  const order: any = await db.order.findUnique({
    where: { id, userId: (session.user as any).id },
    include: {
      items: {
        include: { product: { include: { images: { where: { isPrimary: true } } } } },
      },
      payments: true,
    },
  })

  if (!order) notFound()

  const statusInfo = STATUS_MAP[order.status as string] ?? STATUS_MAP.PENDING!
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status)
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED"
  const shippingAddress = order.shippingAddress as Record<string, string> | null

  const formattedDate = fa
    ? new Date(order.createdAt).toLocaleDateString("fa-IR", { dateStyle: "long" })
    : new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })

  return (
    <>
      <div className="od-root">
        {/* Back */}
        <Link href={`/${locale}/account/orders`} className="od-back">
          {fa ? "← برگشت به سفارش‌ها" : "← Back to Orders"}
        </Link>

        {/* Header */}
        <div className="od-header">
          <div>
            <h1 className="od-title">
              {fa
                ? `سفارش شماره ${order.orderNumber.toLocaleString("fa-IR")}`
                : `Order #${order.orderNumber}`}
            </h1>
            <p className="od-date">{formattedDate}</p>
          </div>
          <span className={`status-badge status-badge--${statusInfo.variant}`}>
            {fa ? statusInfo.fa : statusInfo.en}
          </span>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="od-card od-timeline-card">
            <h2 className="od-section-title">{fa ? "وضعیت سفارش" : "Order Status"}</h2>
            <div className="od-timeline">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = stepIndex >= idx
                const isLast = idx === STATUS_STEPS.length - 1
                return (
                  <div key={step.key} className="od-timeline__item">
                    <div className="od-timeline__dot-wrap">
                      <div className={`od-timeline__dot ${isCompleted ? "od-timeline__dot--done" : ""}`}>
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span className={`od-timeline__label ${isCompleted ? "od-timeline__label--done" : ""}`}>
                        {fa ? step.fa : step.en}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`od-timeline__bar ${stepIndex > idx ? "od-timeline__bar--done" : ""}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="od-card">
          <h2 className="od-section-title">{fa ? "اقلام سفارش" : "Order Items"}</h2>
          <div className="od-items">
            {order.items.map((item: any) => {
              const product = item.product
              const img = product?.images?.[0]
              const name = product
                ? (fa ? product.nameFa : (product.nameEn ?? product.nameFa))
                : (fa ? "محصول حذف‌شده" : "Deleted product")
              return (
                <div key={item.id} className="od-item">
                  <div className="od-item__img">
                    {img ? (
                      <Image src={img.url} alt={name} fill className="od-item__img-el" sizes="56px" />
                    ) : (
                      <div className="od-item__img-placeholder" />
                    )}
                  </div>
                  <div className="od-item__body">
                    <p className="od-item__name">{name}</p>
                    <p className="od-item__qty">
                      {fa ? `تعداد: ${item.quantity.toLocaleString("fa-IR")}` : `Qty: ${item.quantity}`}
                      {" · "}
                      {formatPrice(item.unitPrice, locale)}
                    </p>
                  </div>
                  <p className="od-item__total">{formatPrice(item.totalPrice, locale)}</p>
                </div>
              )
            })}
          </div>

          <hr className="od-divider" />

          <div className="od-totals">
            <div className="od-totals__row">
              <span>{fa ? "جمع کالاها" : "Subtotal"}</span>
              <span>{formatPrice(order.subtotal, locale)}</span>
            </div>
            <div className="od-totals__row">
              <span>{fa ? "هزینه ارسال" : "Shipping"}</span>
              <span>{formatPrice(order.shippingCost, locale)}</span>
            </div>
            <div className="od-totals__row od-totals__row--total">
              <span>{fa ? "مجموع نهایی" : "Total"}</span>
              <span className="od-totals__total-val">{formatPrice(order.totalAmount, locale)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingAddress && (
          <div className="od-card">
            <h2 className="od-section-title">{fa ? "آدرس تحویل" : "Shipping Address"}</h2>
            <address className="od-address">
              {shippingAddress.name && <p className="od-address__name">{shippingAddress.name}</p>}
              {shippingAddress.address && <p>{shippingAddress.address}</p>}
              {(shippingAddress.city || shippingAddress.province) && (
                <p>{[shippingAddress.city, shippingAddress.province].filter(Boolean).join("، ")}</p>
              )}
              {shippingAddress.postalCode && (
                <p>{fa ? "کد پستی:" : "Postal Code:"} {shippingAddress.postalCode}</p>
              )}
              {shippingAddress.phone && (
                <p>{fa ? `تلفن: ${shippingAddress.phone}` : `Phone: ${shippingAddress.phone}`}</p>
              )}
            </address>
          </div>
        )}
      </div>

      <style>{`
        .od-root {
          max-width: 48rem;
          margin: 0 auto;
          padding-inline: 1rem;
          padding-block: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .od-back {
          display: inline-flex;
          align-items: center;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .od-back:hover { color: var(--color-text); }

        .od-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .od-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .od-date {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
        }

        .od-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
        }
        .od-section-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 1rem;
        }

        /* Timeline */
        .od-timeline-card { }
        .od-timeline {
          display: flex;
          align-items: flex-start;
        }
        .od-timeline__item {
          flex: 1;
          display: flex;
          align-items: center;
        }
        .od-timeline__dot-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }
        .od-timeline__dot {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          background-color: var(--color-border-subtle);
          color: var(--color-text-muted);
          transition: background-color var(--transition-base), color var(--transition-base);
        }
        .od-timeline__dot--done {
          background-color: var(--color-accent);
          color: #fff;
        }
        .od-timeline__label {
          font-size: 0.625rem;
          text-align: center;
          width: 3.5rem;
          color: var(--color-text-muted);
          line-height: 1.3;
        }
        .od-timeline__label--done { color: var(--color-text-secondary); font-weight: 600; }
        .od-timeline__bar {
          flex: 1;
          height: 2px;
          background-color: var(--color-border);
          margin-inline: 0.25rem;
          margin-bottom: 1.5rem;
          transition: background-color var(--transition-base);
        }
        .od-timeline__bar--done { background-color: var(--color-accent); }

        /* Items */
        .od-items { display: flex; flex-direction: column; gap: 1rem; }
        .od-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }
        .od-item__img {
          position: relative;
          width: 3.5rem;
          height: 3.5rem;
          flex-shrink: 0;
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--color-background);
          border: 1px solid var(--color-border-subtle);
        }
        .od-item__img-el {
          object-fit: contain;
          padding: 0.25rem;
        }
        .od-item__img-placeholder {
          width: 100%;
          height: 100%;
          background-color: var(--color-border-subtle);
        }
        .od-item__body { flex: 1; min-width: 0; }
        .od-item__name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .od-item__qty {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 0.2rem;
          font-variant-numeric: tabular-nums;
        }
        .od-item__total {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text);
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }

        .od-divider {
          border: none;
          border-top: 1px solid var(--color-border);
          margin-block: 1.25rem;
        }
        .od-totals { display: flex; flex-direction: column; gap: 0.5rem; }
        .od-totals__row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .od-totals__row--total {
          font-size: 1rem;
          font-weight: 800;
          color: var(--color-text);
        }
        .od-totals__total-val { color: var(--color-accent); }

        /* Address */
        .od-address {
          font-style: normal;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          line-height: 1.6;
        }
        .od-address__name {
          font-weight: 700;
          color: var(--color-text);
        }

        .status-badge { display: inline-flex; align-items: center; padding: 0.175rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; white-space: nowrap; }
        .status-badge--success { background-color: var(--color-success-subtle); color: var(--color-success); }
        .status-badge--warning { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .status-badge--danger  { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .status-badge--info    { background-color: var(--color-accent-subtle);  color: var(--color-accent);  }
      `}</style>
    </>
  )
}
