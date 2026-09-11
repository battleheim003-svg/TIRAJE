"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  LifeBuoy,
  Tag,
  Building2,
  MessageSquare,
  TrendingUp,
  X,
  LogOut,
  Store,
} from "lucide-react"
import { signOut } from "next-auth/react"
import styles from "./AdminSidebar.module.css"

interface AdminSidebarProps {
  locale: string
  mobileOpen: boolean
  onCloseMobile: () => void
  counts?: {
    orders?: number
    tickets?: number
  }
}

interface NavItemDef {
  key: string
  href: string
  icon: LucideIcon
  fa: string
  en: string
  countKey?: "orders" | "tickets"
}

interface NavSectionDef {
  labelFa: string
  labelEn: string
  items: NavItemDef[]
}

const NAV_SECTIONS: NavSectionDef[] = [
  {
    labelFa: "اصلی",
    labelEn: "Overview",
    items: [
      { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard, fa: "داشبورد", en: "Dashboard" },
      { key: "daily-price", href: "/admin/daily-price", icon: TrendingUp, fa: "اعلام قیمت روز", en: "Daily Prices" },
    ],
  },
  {
    labelFa: "فروش و بازرگانی",
    labelEn: "Commerce",
    items: [
      { key: "products", href: "/admin/products", icon: Package, fa: "محصولات", en: "Products" },
      { key: "categories", href: "/admin/categories", icon: Tag, fa: "دسته‌بندی‌ها", en: "Categories" },
      { key: "brands", href: "/admin/brands", icon: Building2, fa: "برندها و کارخانجات", en: "Brands" },
      { key: "orders", href: "/admin/orders", icon: ShoppingCart, fa: "سفارش‌ها", en: "Orders", countKey: "orders" },
      { key: "quotes", href: "/admin/quotes", icon: MessageSquare, fa: "استعلام‌های قیمت", en: "Quotes" },
    ],
  },
  {
    labelFa: "مدیریت و پشتیبانی",
    labelEn: "Management & CRM",
    items: [
      { key: "users", href: "/admin/users", icon: Users, fa: "کاربران", en: "Users" },
      { key: "tickets", href: "/admin/tickets", icon: LifeBuoy, fa: "تیکت‌های پشتیبانی", en: "Tickets", countKey: "tickets" },
      { key: "blog", href: "/admin/blog", icon: FileText, fa: "مقالات وبلاگ", en: "Blog Posts" },
    ],
  },
]

export function AdminSidebar({
  locale,
  mobileOpen,
  onCloseMobile,
  counts,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const fa = locale === "fa"

  // Automatically close mobile drawer when route changes
  useEffect(() => {
    onCloseMobile()
  }, [pathname, onCloseMobile])

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div
        className={[
          styles["web-adm-sb__overlay"],
          mobileOpen ? styles["web-adm-sb__overlay--visible"] : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        className={[
          styles["web-adm-sb__sidebar"],
          mobileOpen ? styles["web-adm-sb__sidebar--open"] : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={fa ? "منوی اصلی مدیریت" : "Admin Navigation"}
      >
        {/* Header / Logo */}
        <div className={styles["web-adm-sb__header"]}>
          <Link href={`/${locale}/admin/dashboard`} className={styles["web-adm-sb__logo"]}>
            <Package
              className={styles["web-adm-sb__logo-icon"]}
              style={{ width: "1.5rem", height: "1.5rem" }}
              aria-hidden="true"
            />
            <span>{fa ? "پنل مدیریت تیراژه" : "Tirajeh Admin"}</span>
          </Link>

          <button
            type="button"
            className={styles["web-adm-sb__close-btn"]}
            onClick={onCloseMobile}
            aria-label={fa ? "بستن منو" : "Close menu"}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className={styles["web-adm-sb__nav"]}>
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className={styles["web-adm-sb__section"]}>
              <span className={styles["web-adm-sb__section-label"]}>
                {fa ? section.labelFa : section.labelEn}
              </span>
              <ul className={styles["web-adm-sb__list"]} role="list">
                {section.items.map((item) => {
                  const fullHref = `/${locale}${item.href}`
                  const isActive =
                    pathname === fullHref ||
                    (item.href !== "/admin/dashboard" && pathname.startsWith(`${fullHref}/`))
                  const Icon = item.icon
                  const count = item.countKey && counts ? counts[item.countKey] ?? 0 : 0
                  const label = fa ? item.fa : item.en

                  return (
                    <li key={item.key}>
                      <Link
                        href={fullHref}
                        className={[
                          styles["web-adm-sb__link"],
                          isActive ? styles["web-adm-sb__link--active"] : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon
                          className={styles["web-adm-sb__link-icon"]}
                          style={{ width: "1.25rem", height: "1.25rem" }}
                          aria-hidden="true"
                        />
                        <span className={styles["web-adm-sb__link-label"]}>{label}</span>
                        {count > 0 && (
                          <span className={styles["web-adm-sb__badge"]}>
                            {fa ? count.toLocaleString("fa-IR") : count}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className={styles["web-adm-sb__footer"]}>
          <Link
            href={`/${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles["web-adm-sb__link"]}
          >
            <Store style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
            <span className={styles["web-adm-sb__link-label"]}>
              {fa ? "مشاهده فروشگاه" : "View Storefront"}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
            className={styles["web-adm-sb__logout-btn"]}
          >
            <LogOut style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
            <span className={styles["web-adm-sb__link-label"]}>
              {fa ? "خروج از حساب کاربری" : "Sign Out"}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
