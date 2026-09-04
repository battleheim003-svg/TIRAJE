import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { db } from "@tirajeh/database"
import Link from "next/link"
import type { Metadata } from "next"
import { User, Mail, Phone, Shield, Package, LogOut, LayoutDashboard, Calendar } from "lucide-react"
import { logoutAction } from "@/actions/auth"

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
  const date = new Date(user.createdAt)
  const registeredDate = fa
    ? date.toLocaleDateString("fa-IR")
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const isAdmin = user.role.name === "admin" || user.role.name === "super_admin"

  return (
    <>
      <div className="account-root">
        <h1 className="account-title">{fa ? "حساب کاربری" : "My Account"}</h1>

        <div className="account-grid">
          {/* User info card */}
          <div className="account-card">
            <div className="account-card__head">
              <div className="account-avatar">
                <User size={28} className="account-avatar__icon" />
              </div>
              <div className="account-card__titles">
                <h2 className="account-name">{user.name}</h2>
                <span className="account-role-badge">
                  {user.role.displayName || user.role.name}
                </span>
              </div>
            </div>

            <div className="account-info-list">
              <div className="account-info-item">
                <div className="account-info-item__label">
                  <Mail size={16} />
                  <span>{fa ? "ایمیل" : "Email"}</span>
                </div>
                <span className="account-info-item__value" dir="ltr">
                  {user.email || "—"}
                </span>
              </div>

              <div className="account-info-item">
                <div className="account-info-item__label">
                  <Phone size={16} />
                  <span>{fa ? "شماره همراه" : "Phone"}</span>
                </div>
                <span className="account-info-item__value" dir="ltr">
                  {user.phone || (fa ? "ثبت‌نشده" : "Not set")}
                </span>
              </div>

              <div className="account-info-item">
                <div className="account-info-item__label">
                  <Shield size={16} />
                  <span>{fa ? "نوع حساب" : "Account Type"}</span>
                </div>
                <span className="account-info-item__value">
                  {fa ? customerTypeLabel.fa : customerTypeLabel.en}
                </span>
              </div>

              <div className="account-info-item">
                <div className="account-info-item__label">
                  <Calendar size={16} />
                  <span>{fa ? "تاریخ عضویت" : "Member Since"}</span>
                </div>
                <span className="account-info-item__value">
                  {registeredDate}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions card */}
          <div className="account-actions-card">
            <h3 className="account-actions-title">
              {fa ? "دسترسی سریع" : "Quick Actions"}
            </h3>

            <div className="account-nav-list">
              {isAdmin && (
                <Link href={`/${locale}/admin/dashboard`} className="account-nav-btn account-nav-btn--admin">
                  <LayoutDashboard size={18} />
                  <span>{fa ? "ورود به پنل مدیریت" : "Admin Panel"}</span>
                </Link>
              )}

              <Link href={`/${locale}/account/orders`} className="account-nav-btn">
                <Package size={18} />
                <span>{fa ? "سفارش‌های من" : "My Orders"}</span>
              </Link>

              <Link href={`/${locale}/products`} className="account-nav-btn">
                <Package size={18} />
                <span>{fa ? "مشاهده محصولات" : "Browse Products"}</span>
              </Link>

              <form action={logoutAction} className="account-logout-form">
                <button type="submit" className="account-logout-btn">
                  <LogOut size={18} />
                  <span>{fa ? "خروج از حساب کاربری" : "Sign Out"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .account-root {
          max-width: 54rem;
          margin: 0 auto;
          padding: 2.5rem 1rem;
        }
        .account-title {
          font-size: 1.625rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
          margin-bottom: 2rem;
        }
        .account-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .account-grid {
            grid-template-columns: 1.6fr 1fr;
          }
        }

        .account-card, .account-actions-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.75rem;
          box-shadow: var(--shadow-sm);
        }

        .account-card__head {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 1.5rem;
        }

        .account-avatar {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 9999px;
          background-color: var(--color-accent-subtle);
          color: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .account-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-text);
          margin-bottom: 0.25rem;
        }

        .account-role-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.15rem 0.55rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          background-color: var(--color-accent-subtle);
          color: var(--color-accent);
        }

        .account-info-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .account-info-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          gap: 1rem;
        }

        .account-info-item__label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-muted);
        }

        .account-info-item__value {
          font-weight: 600;
          color: var(--color-text);
        }

        .account-actions-title {
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 1.25rem;
        }

        .account-nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .account-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text);
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .account-nav-btn:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
          background-color: var(--color-accent-subtle);
        }

        .account-nav-btn--admin {
          background-color: var(--color-accent);
          color: #fff;
          border-color: var(--color-accent);
        }
        .account-nav-btn--admin:hover {
          background-color: var(--color-accent-hover);
          color: #fff;
        }

        .account-logout-form {
          margin-top: 0.5rem;
        }

        .account-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background-color: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-danger);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .account-logout-btn:hover {
          background-color: var(--color-danger-subtle);
          border-color: var(--color-danger);
        }
      `}</style>
    </>
  )
}
