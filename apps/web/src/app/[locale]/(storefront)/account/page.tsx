import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import Link from "next/link"
import type { Metadata } from "next"
import {
  User,
  Mail,
  Phone,
  Shield,
  Package,
  LogOut,
  LayoutDashboard,
  Calendar,
} from "lucide-react"
import { Card, Badge } from "@tirajeh/ui"
import { logoutAction } from "@/actions/auth"
import { formatJalali } from "@tirajeh/shared"
import styles from "./Account.module.css"

export const metadata: Metadata = { title: "حساب کاربری | تیراژه" }

const CUSTOMER_TYPE_MAP: Record<string, { fa: string; en: string }> = {
  NORMAL: { fa: "شخص حقیقی", en: "Individual" },
  CONTRACTOR: { fa: "پیمانکار", en: "Contractor" },
  COMPANY: { fa: "شرکت / حقوقی", en: "Company" },
}

export default async function AccountPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const session = await auth()
  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  })

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const customerTypeLabel =
    CUSTOMER_TYPE_MAP[user.customerType] ?? CUSTOMER_TYPE_MAP.NORMAL!
  const registeredDate = formatJalali(user.createdAt)

  const isAdmin =
    user.role.name === "admin" || user.role.name === "super_admin"

  return (
    <div className={styles["web-acct"]}>
      <h1 className={styles["web-acct__title"]}>
        {fa ? "حساب کاربری" : "My Account"}
      </h1>

      <div className={styles["web-acct__layout"]}>
        {/* Sidebar nav */}
        <aside className={styles["web-acct__sidebar"]}>
          <Link
            href={`/${locale}/account`}
            className={`${styles["web-acct__nav-link"]} ${styles["web-acct__nav-link--active"]}`}
          >
            <User style={{ width: "1.125rem", height: "1.125rem" }} />
            <span>{fa ? "مشخصات حساب" : "Profile Overview"}</span>
          </Link>

          <Link
            href={`/${locale}/account/orders`}
            className={styles["web-acct__nav-link"]}
          >
            <Package style={{ width: "1.125rem", height: "1.125rem" }} />
            <span>{fa ? "سفارش‌های من" : "My Orders"}</span>
          </Link>

          {isAdmin && (
            <Link
              href={`/${locale}/admin/dashboard`}
              className={styles["web-acct__nav-link"]}
            >
              <LayoutDashboard style={{ width: "1.125rem", height: "1.125rem" }} />
              <span>{fa ? "پنل مدیریت" : "Admin Panel"}</span>
            </Link>
          )}

          <form action={logoutAction} className={styles["web-acct__logout-form"]}>
            <button type="submit" className={styles["web-acct__logout-btn"]}>
              <LogOut style={{ width: "1.125rem", height: "1.125rem" }} />
              <span>{fa ? "خروج از حساب" : "Sign Out"}</span>
            </button>
          </form>
        </aside>

        {/* Main Content Area */}
        <div className={styles["web-acct__content"]}>
          <Card>
            <div className={styles["web-acct__card-head"]}>
              <div className={styles["web-acct__avatar"]}>
                <User style={{ width: "1.75rem", height: "1.75rem" }} />
              </div>
              <div className={styles["web-acct__titles"]}>
                <h2 className={styles["web-acct__name"]}>{user.name}</h2>
                <Badge variant="primary">
                  {user.role.displayName || user.role.name}
                </Badge>
              </div>
            </div>

            <div className={styles["web-acct__info-list"]}>
              <div className={styles["web-acct__info-item"]}>
                <span className={styles["web-acct__info-label"]}>
                  <Mail style={{ width: "1rem", height: "1rem" }} />
                  <span>{fa ? "ایمیل" : "Email"}</span>
                </span>
                <span className={styles["web-acct__info-value"]} dir="ltr">
                  {user.email || "—"}
                </span>
              </div>

              <div className={styles["web-acct__info-item"]}>
                <span className={styles["web-acct__info-label"]}>
                  <Phone style={{ width: "1rem", height: "1rem" }} />
                  <span>{fa ? "شماره همراه" : "Phone"}</span>
                </span>
                <span className={styles["web-acct__info-value"]} dir="ltr">
                  {user.phone || (fa ? "ثبت‌نشده" : "Not set")}
                </span>
              </div>

              <div className={styles["web-acct__info-item"]}>
                <span className={styles["web-acct__info-label"]}>
                  <Shield style={{ width: "1rem", height: "1rem" }} />
                  <span>{fa ? "نوع حساب" : "Account Type"}</span>
                </span>
                <span className={styles["web-acct__info-value"]}>
                  {fa ? customerTypeLabel.fa : customerTypeLabel.en}
                </span>
              </div>

              <div className={styles["web-acct__info-item"]}>
                <span className={styles["web-acct__info-label"]}>
                  <Calendar style={{ width: "1rem", height: "1rem" }} />
                  <span>{fa ? "تاریخ عضویت" : "Member Since"}</span>
                </span>
                <span className={styles["web-acct__info-value"]}>
                  {registeredDate}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}