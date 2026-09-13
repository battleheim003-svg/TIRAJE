"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
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
import { PERMISSIONS } from "@tirajeh/shared"
import styles from "@/components/admin/AdminSidebar.module.css"

interface AdminNavProps {
  locale: string
  fa: boolean
  onClose?: () => void
  userPermissions?: string[]
}

interface NavItem {
  key: string
  href: string
  icon: LucideIcon
  fa: string
  en: string
  permission?: string | string[]
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard, fa: "داشبورد", en: "Dashboard" },
  { key: "products", href: "/admin/products", icon: Package, fa: "محصولات", en: "Products", permission: [PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE] },
  { key: "orders", href: "/admin/orders", icon: ShoppingBag, fa: "سفارش‌ها", en: "Orders", permission: PERMISSIONS.ORDERS_READ },
  { key: "users", href: "/admin/users", icon: Users, fa: "کاربران", en: "Users", permission: PERMISSIONS.USERS_READ },
  { key: "categories", href: "/admin/categories", icon: Tag, fa: "دسته‌بندی‌ها", en: "Categories", permission: PERMISSIONS.CATEGORIES_ALL },
  { key: "brands", href: "/admin/brands", icon: Building2, fa: "برندها", en: "Brands", permission: PERMISSIONS.BRANDS_ALL },
  { key: "blog", href: "/admin/blog", icon: FileText, fa: "مقالات", en: "Blog", permission: PERMISSIONS.BLOG_ALL },
  { key: "quotes", href: "/admin/quotes", icon: MessageSquare, fa: "درخواست‌های قیمت", en: "Quotes", permission: PERMISSIONS.QUOTES_UPDATE },
  { key: "daily-price", href: "/admin/daily-price", icon: TrendingUp, fa: "اعلام قیمت روز", en: "Daily Prices", permission: PERMISSIONS.PRICES_PUBLISH },
  { key: "tickets", href: "/admin/tickets", icon: LifeBuoy, fa: "تیکت‌های پشتیبانی", en: "Support Tickets", permission: PERMISSIONS.TICKETS_REPLY },
]

export function AdminNav({ locale, fa, onClose, userPermissions }: AdminNavProps) {
  const pathname = usePathname()

  function canAccess(itemPermission?: string | string[]) {
    if (!itemPermission) return true
    if (!userPermissions) return true
    if (userPermissions.includes("*")) return true
    if (Array.isArray(itemPermission)) {
      return itemPermission.some((p) => userPermissions.includes(p))
    }
    return userPermissions.includes(itemPermission)
  }

  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.permission))

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
        {visibleItems.map(({ key, href, icon: Icon, fa: faLabel, en: enLabel }) => {
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
