import { notFound } from "next/navigation"
import Link from "next/link"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { Badge } from "@tirajeh/ui"
import { formatToman, formatRelativeTime } from "@/lib/cement"
import OrderStatusForm from "./order-status-form"
import styles from "./OrderDetail.module.css"

type Props = { params: Promise<{ locale: string; id: string }> }

export const metadata: Metadata = { title: "جزئیات سفارش | پنل مدیریت تیراژه" }

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

const PAYMENT_STATUS_LABEL: Record<string, { fa: string; en: string; variant: "warning" | "info" | "success" | "danger" }> = {
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
          product: { select: { id: true, nameFa: true, nameEn: true, slug: true } },
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
    fa: order.status, en: order.status, variant: "info" as const,
  }

  const shippingAddress = order.shippingAddress as Record<string, string> | null
  const formattedDate = fa
    ? new Date(order.createdAt).toLocaleDateString("fa-IR", { dateStyle: "long" })
    : new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })

  return (
    <div className={styles["web-adm-ord__wrapper"]}>
      {/* Back + header */}
      <div className={styles["web-adm-ord__topbar"]}>
        <Link href={`/${locale}/admin/orders`} className={styles["web-adm-ord__backLink"]}>
          {fa ? "← بازگشت به سفارش‌ها" : "← Back to Orders"}
        </Link>
      </div>

      <div className={styles["web-adm-ord__header"]}>
        <div>
          <h1 className={styles["web-adm-ord__title"]}>
            {fa
              ? `سفارش #${order.orderNumber.toLocaleString("fa-IR")}`
              : `Order #${order.orderNumber}`}
          </h1>
          <p className={styles["web-adm-ord__date"]}>{formattedDate}</p>
        </div>
        <Badge variant={statusInfo.variant}>
          {fa ? statusInfo.fa : statusInfo.en}
        </Badge>
      </div>

      {/* Status update */}
      <div className={styles["web-adm-ord__card"]}>
        <h2 className={styles["web-adm-ord__sectionTitle"]}>{fa ? "تغییر وضعیت" : "Update Status"}</h2>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} fa={fa} />
      </div>

      <div className={styles["web-adm-ord__grid"]}>
        {/* Customer */}
        <div className={styles["web-adm-ord__card"]}>
          <h2 className={styles["web-adm-ord__sectionTitle"]}>{fa ? "مشتری" : "Customer"}</h2>
          <dl className={styles["web-adm-ord__dl"]}>
            <div className={styles["web-adm-ord__dlRow"]}>
              <dt>{fa ? "نام" : "Name"}</dt>
              <dd>{order.user.name}</dd>
            </div>
            {order.user.email && (
              <div className={styles["web-adm-ord__dlRow"]}>
                <dt>{fa ? "ایمیل" : "Email"}</dt>
                <dd dir="ltr">{order.user.email}</dd>
              </div>
            )}
            {order.user.phone && (
              <div className={styles["web-adm-ord__dlRow"]}>
                <dt>{fa ? "تلفن" : "Phone"}</dt>
                <dd dir="ltr">{order.user.phone}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Shipping address */}
        {shippingAddress && (
          <div className={styles["web-adm-ord__card"]}>
            <h2 className={styles["web-adm-ord__sectionTitle"]}>{fa ? "آدرس تحویل" : "Shipping Address"}</h2>
            <address className={styles["web-adm-ord__address"]}>
              {shippingAddress.name && <p className={styles["web-adm-ord__addressName"]}>{shippingAddress.name}</p>}
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
      <div className={styles["web-adm-ord__card"]}>
        <h2 className={styles["web-adm-ord__sectionTitle"]}>{fa ? "اقلام سفارش" : "Order Items"}</h2>
        <div className={styles["web-adm-ord__tableWrap"]}>
          <table className={styles["web-adm-ord__table"]}>
            <thead>
              <tr>
                <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "محصول" : "Product"}</th>
                <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "تعداد" : "Qty"}</th>
                <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "قیمت واحد" : "Unit Price"}</th>
                <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "جمع" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const product = item.product
                const name = product
                  ? (fa ? product.nameFa : (product.nameEn ?? product.nameFa))
                  : (fa ? "محصول حذف‌شده" : "Deleted product")
                return (
                  <tr key={item.id}>
                    <td className={styles["web-adm-ord__td"]}>
                      {product ? (
                        <Link
                          href={`/${locale}/admin/products/${product.id}`}
                          className={styles["web-adm-ord__link"]}
                        >
                          {name}
                        </Link>
                      ) : (
                        <span>{name}</span>
                      )}
                    </td>
                    <td className={styles["web-adm-ord__td"]} style={{ fontVariantNumeric: "tabular-nums" }}>
                      {fa ? item.quantity.toLocaleString("fa-IR") : item.quantity}
                    </td>
                    <td className={styles["web-adm-ord__td"]} style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatToman(Number(item.unitPrice), locale as "fa" | "en")}
                    </td>
                    <td className={styles["web-adm-ord__td"]} style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                      {formatToman(Number(item.totalPrice), locale as "fa" | "en")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={styles["web-adm-ord__totals"]}>
          <div className={styles["web-adm-ord__totalsRow"]}>
            <span>{fa ? "جمع کالاها" : "Subtotal"}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatToman(Number(order.subtotal), locale as "fa" | "en")}</span>
          </div>
          <div className={styles["web-adm-ord__totalsRow"]}>
            <span>{fa ? "هزینه ارسال" : "Shipping"}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatToman(Number(order.shippingCost), locale as "fa" | "en")}</span>
          </div>
          <div className={styles["web-adm-ord__totalsRowTotal"]}>
            <span>{fa ? "مجموع نهایی" : "Total"}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatToman(Number(order.totalAmount), locale as "fa" | "en")}</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {order.payments.length > 0 && (
        <div className={styles["web-adm-ord__card"]}>
          <h2 className={styles["web-adm-ord__sectionTitle"]}>{fa ? "پرداخت‌ها" : "Payments"}</h2>
          <div className={styles["web-adm-ord__tableWrap"]}>
            <table className={styles["web-adm-ord__table"]}>
              <thead>
                <tr>
                  <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "درگاه" : "Gateway"}</th>
                  <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "مبلغ" : "Amount"}</th>
                  <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "وضعیت" : "Status"}</th>
                  <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "تاریخ" : "Date"}</th>
                  <th scope="col" className={styles["web-adm-ord__th"]}>{fa ? "کد پیگیری" : "Ref"}</th>
                </tr>
              </thead>
              <tbody>
                {order.payments.map((pmt) => {
                  const pStatus = PAYMENT_STATUS_LABEL[pmt.status] ?? { fa: pmt.status, en: pmt.status, variant: "info" as const }
                  return (
                    <tr key={pmt.id}>
                      <td className={styles["web-adm-ord__td"]}>{pmt.gateway}</td>
                      <td className={styles["web-adm-ord__td"]} style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                        {formatToman(Number(pmt.amount), locale as "fa" | "en")}
                      </td>
                      <td className={styles["web-adm-ord__td"]}>
                        <Badge variant={pStatus.variant}>
                          {fa ? pStatus.fa : pStatus.en}
                        </Badge>
                      </td>
                      <td className={styles["web-adm-ord__td"]}>
                        {formatRelativeTime(pmt.createdAt, locale)}
                      </td>
                      <td className={styles["web-adm-ord__td"]} dir="ltr">
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
      {order.events.length > 0 && (
        <div className={styles["web-adm-ord__card"]}>
          <h2 className={styles["web-adm-ord__sectionTitle"]}>{fa ? "تاریخچه وضعیت" : "Status History"}</h2>
          <div className={styles["web-adm-ord__timeline"]}>
            {order.events.map((ev) => {
              const evStatus = ORDER_STATUS_LABEL[ev.status] ?? { fa: ev.status, en: ev.status, variant: "info" as const }
              return (
                <div key={ev.id} className={styles["web-adm-ord__timelineItem"]}>
                  <div className={styles["web-adm-ord__timelineDot"]} />
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={evStatus.variant}>
                      {fa ? evStatus.fa : evStatus.en}
                    </Badge>
                  </div>
                  {ev.note && <p className={styles["web-adm-ord__timelineDesc"]}>{ev.note}</p>}
                  <p className={styles["web-adm-ord__timelineTime"]}>
                    {ev.actor?.name ?? (fa ? "سیستم" : "System")}
                    {" · "}
                    {formatRelativeTime(ev.createdAt, locale)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Admin note */}
      {order.adminNote && (
        <div className={styles["web-adm-ord__card"]}>
          <h2 className={styles["web-adm-ord__sectionTitle"]}>{fa ? "یادداشت مدیر" : "Admin Note"}</h2>
          <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>{order.adminNote}</p>
        </div>
      )}
    </div>
  )
}
