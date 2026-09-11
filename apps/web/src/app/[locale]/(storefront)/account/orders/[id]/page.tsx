import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { Card, Badge, Button, type BadgeVariant } from "@tirajeh/ui"
import { formatPrice } from "@/lib/cement"
import styles from "./OrderDetail.module.css"

type Props = { params: Promise<{ locale: string; id: string }> }

export const metadata: Metadata = { title: "جزئیات سفارش | تیراژه" }

const STATUS_STEPS = [
  { key: "PENDING",    fa: "ثبت سفارش", en: "Order Placed" },
  { key: "CONFIRMED",  fa: "تأیید شده",  en: "Confirmed"   },
  { key: "PROCESSING", fa: "پردازش",     en: "Processing"  },
  { key: "SHIPPED",    fa: "ارسال",      en: "Shipped"     },
  { key: "DELIVERED",  fa: "تحویل",      en: "Delivered"   },
]

const STATUS_MAP: Record<string, { fa: string; en: string; variant: BadgeVariant }> = {
  PENDING:          { fa: "در انتظار تأیید",   en: "Pending",          variant: "warning" },
  AWAITING_PAYMENT: { fa: "انتظار پرداخت",     en: "Awaiting Payment", variant: "warning" },
  CONFIRMED:        { fa: "تأیید شده",          en: "Confirmed",        variant: "primary" },
  PROCESSING:       { fa: "در حال پردازش",     en: "Processing",       variant: "primary" },
  SHIPPED:          { fa: "ارسال شده",          en: "Shipped",          variant: "default" },
  DELIVERED:        { fa: "تحویل داده شده",    en: "Delivered",        variant: "success" },
  CANCELLED:        { fa: "لغو شده",            en: "Cancelled",        variant: "error"   },
  REFUNDED:         { fa: "مسترد شده",          en: "Refunded",         variant: "error"   },
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"
  const Arrow = fa ? ArrowRight : ArrowLeft

  const session = await auth()
  if (!session?.user) redirect(`/${locale}/auth/login`)

  const order = await db.order.findUnique({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: { product: { include: { images: { where: { isPrimary: true } } } } },
      },
      payments: true,
    },
  })

  if (!order) notFound()

  const statusInfo =
    STATUS_MAP[order.status as string] ?? STATUS_MAP.PENDING!
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status)
  const isCancelled =
    order.status === "CANCELLED" || order.status === "REFUNDED"
  const shippingAddress = order.shippingAddress as Record<string, string> | null

  const formattedDate = fa
    ? new Date(order.createdAt).toLocaleDateString("fa-IR", { dateStyle: "long" })
    : new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })

  return (
    <div className={styles["web-ord"]}>
      {/* Back button */}
      <Link href={`/${locale}/account/orders`} className={styles["web-ord__back"]}>
        <Arrow style={{ width: "1rem", height: "1rem" }} />
        <span>{fa ? "برگشت به سفارش‌ها" : "Back to Orders"}</span>
      </Link>

      {/* Summary Card */}
      <Card variant="raised">
        <div className={styles["web-ord__summary-content"]}>
          <div>
            <h1 className={styles["web-ord__title"]}>
              {fa
                ? `سفارش شماره ${order.orderNumber.toLocaleString("fa-IR")}`
                : `Order #${order.orderNumber}`}
            </h1>
            <p className={styles["web-ord__date"]}>{formattedDate}</p>
          </div>
          <div className={styles["web-ord__summary-aside"]}>
            <Badge variant={statusInfo.variant}>
              {fa ? statusInfo.fa : statusInfo.en}
            </Badge>
            <p className={styles["web-ord__total-amount"]}>
              {formatPrice(order.totalAmount, locale)}
            </p>
          </div>
        </div>
      </Card>

      {/* Status Timeline */}
      {!isCancelled && (
        <Card>
          <h2 className={styles["web-ord__section-title"]}>
            {fa ? "وضعیت سفارش" : "Order Status"}
          </h2>
          <div className={styles["web-ord__timeline"]}>
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = stepIndex >= idx
              const isLast = idx === STATUS_STEPS.length - 1
              return (
                <div key={step.key} className={styles["web-ord__timeline-item"]}>
                  <div className={styles["web-ord__timeline-dot-wrap"]}>
                    <div
                      className={`${styles["web-ord__timeline-dot"]} ${
                        isCompleted ? styles["web-ord__timeline-dot--done"] : ""
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`${styles["web-ord__timeline-label"]} ${
                        isCompleted ? styles["web-ord__timeline-label--done"] : ""
                      }`}
                    >
                      {fa ? step.fa : step.en}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`${styles["web-ord__timeline-bar"]} ${
                        stepIndex > idx ? styles["web-ord__timeline-bar--done"] : ""
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <h2 className={styles["web-ord__section-title"]}>
          {fa ? "اقلام سفارش" : "Order Items"}
        </h2>
        <div className={styles["web-ord__table-wrap"]}>
          <table className={styles["web-ord__table"]}>
            <thead>
              <tr>
                <th style={{ width: "50%" }}>{fa ? "محصول" : "Product"}</th>
                <th>{fa ? "تعداد" : "Quantity"}</th>
                <th>{fa ? "قیمت واحد" : "Unit Price"}</th>
                <th>{fa ? "مبلغ کل" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const product = item.product
                const img = product?.images?.[0]
                const name = product
                  ? fa
                    ? product.nameFa
                    : (product.nameEn ?? product.nameFa)
                  : fa
                  ? "محصول حذف‌شده"
                  : "Deleted product"

                return (
                  <tr key={item.id}>
                    <td>
                      <div className={styles["web-ord__table-item"]}>
                        <div className={styles["web-ord__table-img"]}>
                          {img ? (
                            <Image
                              src={img.url}
                              alt={name}
                              fill
                              sizes="48px"
                              className={styles["web-ord__table-img-el"]}
                            />
                          ) : (
                            <div className={styles["web-ord__table-placeholder"]} />
                          )}
                        </div>
                        <p className={styles["web-ord__table-name"]}>{name}</p>
                      </div>
                    </td>
                    <td className={styles["web-ord__table-num"]}>
                      {fa ? item.quantity.toLocaleString("fa-IR") : item.quantity}
                    </td>
                    <td className={styles["web-ord__table-num"]}>
                      {formatPrice(item.unitPrice, locale)}
                    </td>
                    <td className={styles["web-ord__table-num"]}>
                      {formatPrice(item.totalPrice, locale)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals section */}
        <div className={styles["web-ord__totals"]}>
          <div className={styles["web-ord__total-row"]}>
            <span>{fa ? "جمع کالاها" : "Subtotal"}</span>
            <span>{formatPrice(order.subtotal, locale)}</span>
          </div>
          <div className={styles["web-ord__total-row"]}>
            <span>{fa ? "هزینه ارسال" : "Shipping"}</span>
            <span>{formatPrice(order.shippingCost, locale)}</span>
          </div>
          <div
            className={`${styles["web-ord__total-row"]} ${styles["web-ord__total-row--final"]}`}
          >
            <span>{fa ? "مجموع نهایی" : "Total"}</span>
            <span className={styles["web-ord__total-final-val"]}>
              {formatPrice(order.totalAmount, locale)}
            </span>
          </div>
        </div>

        <div className={styles["web-ord__actions"]}>
          <Button asChild variant="secondary">
            <Link href={`/${locale}/products`}>
              <RotateCcw style={{ width: "1rem", height: "1rem" }} />
              <span>{fa ? "سفارش مجدد محصولات" : "Reorder Products"}</span>
            </Link>
          </Button>
        </div>
      </Card>

      {/* Shipping Address */}
      {shippingAddress && (
        <Card>
          <h2 className={styles["web-ord__section-title"]}>
            {fa ? "آدرس تحویل" : "Shipping Address"}
          </h2>
          <address className={styles["web-ord__address"]}>
            {shippingAddress.name && (
              <p className={styles["web-ord__address-name"]}>
                {shippingAddress.name}
              </p>
            )}
            {shippingAddress.address && <p>{shippingAddress.address}</p>}
            {(shippingAddress.city || shippingAddress.province) && (
              <p>
                {[shippingAddress.city, shippingAddress.province]
                  .filter(Boolean)
                  .join("، ")}
              </p>
            )}
            {shippingAddress.postalCode && (
              <p>
                {fa ? "کد پستی:" : "Postal Code:"} {shippingAddress.postalCode}
              </p>
            )}
            {shippingAddress.phone && (
              <p>
                {fa
                  ? `تلفن: ${shippingAddress.phone}`
                  : `Phone: ${shippingAddress.phone}`}
              </p>
            )}
          </address>
        </Card>
      )}
    </div>
  )
}