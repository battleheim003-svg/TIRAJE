"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Building2,
  FileText,
  MessageSquare,
  LifeBuoy,
  TrendingUp,
  X,
} from "lucide-react"
import styles from "@/components/admin/AdminSidebar.module.css"

interface AdminNavProps {
  locale: string
  fa: boolean
  onClose?: () => void
}

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard, fa: "داشبورد", en: "Dashboard" },
  { key: "products", href: "/admin/products", icon: Package, fa: "محصولات", en: "Products" },
  { key: "orders", href: "/admin/orders", icon: ShoppingBag, fa: "سفارش‌ها", en: "Orders" },
  { key: "users", href: "/admin/users", icon: Users, fa: "کاربران", en: "Users" },
  { key: "categories", href: "/admin/categories", icon: Tag, fa: "دسته‌بندی‌ها", en: "Categories" },
  { key: "brands", href: "/admin/brands", icon: Building2, fa: "برندها", en: "Brands" },
  { key: "blog", href: "/admin/blog", icon: FileText, fa: "مقالات", en: "Blog" },
  { key: "quotes", href: "/admin/quotes", icon: MessageSquare, fa: "درخواست‌های قیمت", en: "Quotes" },
  { key: "daily-price", href: "/admin/daily-price", icon: TrendingUp, fa: "اعلام قیمت روز", en: "Daily Prices" },
  { key: "tickets", href: "/admin/tickets", icon: LifeBuoy, fa: "تیکت‌های پشتیبانی", en: "Support Tickets" },
] as const

export function AdminNav({ locale, fa, onClose }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className={styles["web-adm-sb__sidebar"]} aria-label={fa ? "منوی مدیریت" : "Admin navigation"}>
      {/* Logo + close button */}
      <div className={styles["web-adm-sb__header"]}>
        <Link href={`/${locale}/admin/dashboard`} className={styles["web-adm-sb__logo"]}>
          <Package style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          <span>{fa ? "پنل مدیریت" : "Admin Panel"}</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={styles["web-adm-sb__close-btn"]}
            aria-label={fa ? "بستن منو" : "Close menu"}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <ul className={styles["web-adm-sb__nav"]} role="list">
        {NAV_ITEMS.map(({ key, href, icon: Icon, fa: faLabel, en: enLabel }) => {
          const fullHref = `/${locale}${href}`
          const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)
          return (
            <li key={key}>
              <Link
                href={fullHref}
                aria-current={isActive ? "page" : undefined}
                className={[
                  styles["web-adm-sb__link"],
                  isActive ? styles["web-adm-sb__link--active"] : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icon style={{ width: "1rem", height: "1rem", flexShrink: 0 }} aria-hidden="true" />
                <span>{fa ? faLabel : enLabel}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
