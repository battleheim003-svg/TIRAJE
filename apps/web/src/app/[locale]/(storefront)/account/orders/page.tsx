import Link from "next/link"
import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { Package, User } from "lucide-react"
import { Card, Badge, Button, type BadgeVariant } from "@tirajeh/ui"
import { formatToman } from "@/lib/cement"
import styles from "./Orders.module.css"

export const metadata: Metadata = { title: "سفارش‌های من | تیراژه" }

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

export default async function OrdersPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const session = await auth()
  if (!session?.user) redirect(`/${locale}/auth/login`)

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })

  return (
    <div className={styles["web-ords"]}>
      <h1 className={styles["web-ords__title"]}>
        {fa ? "سفارش‌های من" : "My Orders"}
      </h1>

      <div className={styles["web-ords__layout"]}>
        {/* Sidebar Nav */}
        <aside className={styles["web-ords__sidebar"]}>
          <Link
            href={`/${locale}/account`}
            className={styles["web-ords__nav-link"]}
          >
            <User style={{ width: "1.125rem", height: "1.125rem" }} />
            <span>{fa ? "مشخصات حساب" : "Profile Overview"}</span>
          </Link>

          <Link
            href={`/${locale}/account/orders`}
            className={`${styles["web-ords__nav-link"]} ${styles["web-ords__nav-link--active"]}`}
          >
            <Package style={{ width: "1.125rem", height: "1.125rem" }} />
            <span>{fa ? "سفارش‌های من" : "My Orders"}</span>
          </Link>
        </aside>

        {/* Content Area */}
        <main>
          {orders.length === 0 ? (
            <div className={styles["web-ords__empty"]}>
              <Package
                className={styles["web-ords__empty-icon"]}
                style={{ width: "3.5rem", height: "3.5rem" }}
                aria-hidden="true"
              />
              <p className={styles["web-ords__empty-msg"]}>
                {fa ? "هنوز سفارشی ثبت نشده است." : "No orders yet."}
              </p>
              <Button asChild variant="primary">
                <Link href={`/${locale}/products`}>
                  {fa ? "شروع خرید" : "Start Shopping"}
                </Link>
              </Button>
            </div>
          ) : (
            <div className={styles["web-ords__list"]}>
              {orders.map((order) => {
                const statusInfo =
                  STATUS_MAP[order.status as string] ?? STATUS_MAP.PENDING!
                const date = new Date(order.createdAt)
                const formattedDate = fa
                  ? date.toLocaleDateString("fa-IR")
                  : date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })

                return (
                  <Link
                    key={order.id}
                    href={`/${locale}/account/orders/${order.id}`}
                    className={styles["web-ords__card-link"]}
                  >
                    <Card variant="outlined" className={styles["web-ords__row"]}>
                      <div className={styles["web-ords__meta"]}>
                        <p className={styles["web-ords__num"]}>
                          {fa
                            ? `سفارش شماره ${order.orderNumber.toLocaleString("fa-IR")}`
                            : `Order #${order.orderNumber}`}
                        </p>
                        <p className={styles["web-ords__date"]}>{formattedDate}</p>
                        <p className={styles["web-ords__items"]}>
                          {fa
                            ? `${order.items.length.toLocaleString("fa-IR")} کالا`
                            : `${order.items.length} item${
                                order.items.length !== 1 ? "s" : ""
                              }`}
                        </p>
                      </div>
                      <div className={styles["web-ords__aside"]}>
                        <Badge variant={statusInfo.variant}>
                          {fa ? statusInfo.fa : statusInfo.en}
                        </Badge>
                        <p className={styles["web-ords__price"]}>
                          {formatToman(order.totalAmount, locale as "fa" | "en")}
                        </p>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}