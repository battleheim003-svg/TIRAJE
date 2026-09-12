import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import {
  ShoppingCart,
  Users,
  Package,
  LifeBuoy,
  PlusCircle,
  TrendingUp,
  FileText,
  MessageSquare,
} from "lucide-react"
import { Card, Badge } from "@tirajeh/ui"
import { StatCard } from "@/components/admin/StatCard"
import { formatToman, formatRelativeTime } from "@/lib/cement"
import styles from "./Dashboard.module.css"

export const metadata: Metadata = { title: "داشبورد | پنل مدیریت تیراژه" }

type BadgeVariant = "warning" | "primary" | "neutral" | "success" | "danger" | "error"

const ORDER_STATUS_LABEL: Record<
  string,
  { fa: string; en: string; variant: BadgeVariant }
> = {
  PENDING: { fa: "در انتظار", en: "Pending", variant: "warning" },
  AWAITING_PAYMENT: { fa: "انتظار پرداخت", en: "Awaiting Payment", variant: "warning" },
  CONFIRMED: { fa: "تأیید شده", en: "Confirmed", variant: "primary" },
  PROCESSING: { fa: "در حال پردازش", en: "Processing", variant: "primary" },
  SHIPPED: { fa: "ارسال شده", en: "Shipped", variant: "neutral" },
  DELIVERED: { fa: "تحویل داده شده", en: "Delivered", variant: "success" },
  CANCELLED: { fa: "لغو شده", en: "Cancelled", variant: "danger" },
  REFUNDED: { fa: "مسترد شده", en: "Refunded", variant: "danger" },
}

export default async function DashboardPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    todayOrdersCount,
    yesterdayOrdersCount,
    totalUsersCount,
    newUsersThisWeek,
    activeProductsCount,
    unreadTicketsCount,
    recentOrders,
  ] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.order.count({ where: { createdAt: { gte: startOfYesterday, lt: startOfToday } } }),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    db.product.count({ where: { isActive: true } }),
    db.contact.count({ where: { status: "UNREAD" } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  const orderDiff = todayOrdersCount - yesterdayOrdersCount

  return (
    <div className={styles["web-adm-dash__root"]}>
      {/* Header */}
      <div className={styles["web-adm-dash__header"]}>
        <h1 className={styles["web-adm-dash__title"]}>
          {fa ? "داشبورد مدیریت و کنترل مرکزی" : "Management Dashboard & Overview"}
        </h1>
        <p className={styles["web-adm-dash__subtitle"]}>
          {fa
            ? "خلاصه آمار عملکرد، سفارش‌های جدید و شاخص‌های کلیدی فروشگاه تیراژه"
            : "Performance summary, recent orders and key business metrics of Tirajeh"}
        </p>
      </div>

      {/* KPI Stat Cards */}
      <div className={styles["web-adm-dash__kpi-grid"]}>
        <StatCard
          label={fa ? "سفارش‌های امروز" : "Today's Orders"}
          value={fa ? todayOrdersCount.toLocaleString("fa-IR") : todayOrdersCount.toLocaleString()}
          icon={<ShoppingCart style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />}
          trend={{
            value: Math.abs(orderDiff),
            direction: orderDiff >= 0 ? "up" : "down",
            label: fa ? "نسبت به دیروز" : "vs yesterday",
          }}
          desc={fa ? "سفارش‌های ثبت شده امروز" : "Total registered orders today"}
          href={`/${locale}/admin/orders`}
        />

        <StatCard
          label={fa ? "کاربران فعال سامانه" : "Active Users"}
          value={fa ? totalUsersCount.toLocaleString("fa-IR") : totalUsersCount.toLocaleString()}
          icon={<Users style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />}
          trend={{
            value: newUsersThisWeek,
            direction: "up",
            label: fa ? "این هفته" : "this week",
          }}
          desc={fa ? "خریداران و پیمانکاران عضو" : "Registered clients and contractors"}
          href={`/${locale}/admin/users`}
        />

        <StatCard
          label={fa ? "محصولات فعال در کاتالوگ" : "Active Products"}
          value={fa ? activeProductsCount.toLocaleString("fa-IR") : activeProductsCount.toLocaleString()}
          icon={<Package style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />}
          desc={fa ? "آماده برای فروش و استعلام" : "Available in catalog"}
          href={`/${locale}/admin/products`}
        />

        <StatCard
          label={fa ? "تیکت‌های جدید نیازمند پاسخ" : "Unread Tickets"}
          value={fa ? unreadTicketsCount.toLocaleString("fa-IR") : unreadTicketsCount.toLocaleString()}
          icon={<LifeBuoy style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />}
          desc={
            unreadTicketsCount > 0
              ? fa
                ? "نیازمند بررسی تیم پشتیبانی"
                : "Awaiting support review"
              : fa
              ? "همه پیام‌ها بررسی شده‌اند"
              : "All inquiries handled"
          }
          href={`/${locale}/admin/tickets`}
        />
      </div>

      {/* Recent Orders Table */}
      <Card variant="flat" className={styles["web-adm-dash__section-card"]}>
        <div className={styles["web-adm-dash__section-head"]}>
          <h2 className={styles["web-adm-dash__section-title"]}>
            {fa ? "آخرین سفارش‌های ثبت‌شده" : "Recent Orders"}
          </h2>
          <Link
            href={`/${locale}/admin/orders`}
            className={styles["web-adm-dash__view-all"]}
          >
            {fa ? "مشاهده همه سفارش‌ها" : "View all orders"}
          </Link>
        </div>

        <div className={styles["web-adm-dash__table-wrap"]}>
          <table className={styles["web-adm-dash__table"]} role="table">
            <thead>
              <tr>
                <th scope="col">{fa ? "شماره سفارش" : "Order #"}</th>
                <th scope="col">{fa ? "مشتری / خریدار" : "Customer"}</th>
                <th scope="col">{fa ? "وضعیت سفارش" : "Status"}</th>
                <th scope="col">{fa ? "مبلغ سفارش" : "Amount"}</th>
                <th scope="col">{fa ? "تاریخ و زمان ثبت" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const statusInfo =
                  ORDER_STATUS_LABEL[order.status as string] ?? {
                    fa: order.status,
                    en: order.status,
                    variant: "neutral" as const,
                  }

                return (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/${locale}/admin/orders/${order.id}`}
                        className={styles["web-adm-dash__order-link"]}
                      >
                        #{fa ? order.orderNumber.toLocaleString("fa-IR") : order.orderNumber}
                      </Link>
                    </td>
                    <td>{order.user?.name ?? order.user?.email ?? "—"}</td>
                    <td>
                      <Badge variant={statusInfo.variant}>
                        {fa ? statusInfo.fa : statusInfo.en}
                      </Badge>
                    </td>
                    <td className={styles["web-adm-dash__tabular"]}>
                      {formatToman(order.totalAmount, locale as "fa" | "en")}
                    </td>
                    <td className={styles["web-adm-dash__tabular"]}>
                      {formatRelativeTime(order.createdAt, locale)}
                    </td>
                  </tr>
                )
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles["web-adm-dash__empty-table"]}>
                    {fa ? "سفارشی در سیستم ثبت نشده است." : "No orders found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions Section */}
      <div>
        <div className={styles["web-adm-dash__section-head"]}>
          <h2 className={styles["web-adm-dash__section-title"]}>
            {fa ? "دسترسی و اقدامات سریع" : "Quick Actions"}
          </h2>
        </div>

        <div className={styles["web-adm-dash__quick-grid"]}>
          <Link
            href={`/${locale}/admin/products/new`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Card
              variant="outlined"
              interactive
              className={styles["web-adm-dash__action-card"]}
            >
              <div className={styles["web-adm-dash__action-icon-wrap"]}>
                <PlusCircle style={{ width: "1.5rem", height: "1.5rem" }} aria-hidden="true" />
              </div>
              <div className={styles["web-adm-dash__action-text"]}>
                <span className={styles["web-adm-dash__action-title"]}>
                  {fa ? "ثبت محصول جدید در کاتالوگ" : "Add New Product"}
                </span>
                <span className={styles["web-adm-dash__action-desc"]}>
                  {fa
                    ? "افزودن انواع سیمان، کلینکر یا پودر گچ ساختمانی به فروشگاه"
                    : "Add new cement, clinker or building materials to catalog"}
                </span>
              </div>
            </Card>
          </Link>

          <Link
            href={`/${locale}/admin/daily-price`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Card
              variant="outlined"
              interactive
              className={styles["web-adm-dash__action-card"]}
            >
              <div className={styles["web-adm-dash__action-icon-wrap"]}>
                <TrendingUp style={{ width: "1.5rem", height: "1.5rem" }} aria-hidden="true" />
              </div>
              <div className={styles["web-adm-dash__action-text"]}>
                <span className={styles["web-adm-dash__action-title"]}>
                  {fa ? "ثبت و اعلام نرخ روز سیمان" : "Daily Cement Pricing"}
                </span>
                <span className={styles["web-adm-dash__action-desc"]}>
                  {fa
                    ? "به‌روزرسانی قیمت نقدی درب کارخانه و ارسال به کانال تلگرام"
                    : "Update factory daily prices and sync with Telegram"}
                </span>
              </div>
            </Card>
          </Link>

          <Link
            href={`/${locale}/admin/quotes`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Card
              variant="outlined"
              interactive
              className={styles["web-adm-dash__action-card"]}
            >
              <div className={styles["web-adm-dash__action-icon-wrap"]}>
                <MessageSquare style={{ width: "1.5rem", height: "1.5rem" }} aria-hidden="true" />
              </div>
              <div className={styles["web-adm-dash__action-text"]}>
                <span className={styles["web-adm-dash__action-title"]}>
                  {fa ? "بررسی درخواست‌های استعلام قیمت (RFQ)" : "Manage Quote Requests"}
                </span>
                <span className={styles["web-adm-dash__action-desc"]}>
                  {fa
                    ? "پاسخ‌گویی به درخواست‌های خرید عمده و صدور پیش‌فاکتور رسمی"
                    : "Review contractor inquiries and issue commercial quotations"}
                </span>
              </div>
            </Card>
          </Link>

          <Link
            href={`/${locale}/admin/blog/new`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Card
              variant="outlined"
              interactive
              className={styles["web-adm-dash__action-card"]}
            >
              <div className={styles["web-adm-dash__action-icon-wrap"]}>
                <FileText style={{ width: "1.5rem", height: "1.5rem" }} aria-hidden="true" />
              </div>
              <div className={styles["web-adm-dash__action-text"]}>
                <span className={styles["web-adm-dash__action-title"]}>
                  {fa ? "نگارش مقاله یا خبر جدید" : "Write Blog Post"}
                </span>
                <span className={styles["web-adm-dash__action-desc"]}>
                  {fa
                    ? "انتشار تحلیل‌های بازار مصالح و مقالات مهندسی بتن و سازه"
                    : "Publish market analyses and structural engineering guides"}
                </span>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
