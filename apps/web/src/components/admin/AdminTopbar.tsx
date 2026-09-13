"use client"

import React, { useMemo, useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  MessageSquare,
  LifeBuoy,
  TrendingUp,
  Package,
  Clock,
} from "lucide-react"
import { formatRelativeFa } from "@tirajeh/shared"
import type { ActivityItem } from "@/lib/admin-activity"
import styles from "./AdminTopbar.module.css"

interface AdminTopbarProps {
  locale: string
  user: { name?: string | null; email?: string | null; roleName?: string | null }
  onOpenMobileMenu: () => void
  totalCount?: number
  items?: ActivityItem[]
}

const ROUTE_LABELS: Record<string, { fa: string; en: string }> = {
  dashboard: { fa: "داشبورد", en: "Dashboard" },
  products: { fa: "محصولات", en: "Products" },
  orders: { fa: "سفارش‌ها", en: "Orders" },
  blog: { fa: "مقالات وبلاگ", en: "Blog" },
  users: { fa: "کاربران", en: "Users" },
  tickets: { fa: "تیکت‌ها", en: "Tickets" },
  categories: { fa: "دسته‌بندی‌ها", en: "Categories" },
  brands: { fa: "برندها", en: "Brands" },
  quotes: { fa: "استعلام قیمت", en: "Quotes" },
  "daily-price": { fa: "قیمت روز", en: "Daily Price" },
  settings: { fa: "تنظیمات", en: "Settings" },
  new: { fa: "جدید", en: "New" },
  edit: { fa: "ویرایش", en: "Edit" },
}

export function AdminTopbar({
  locale,
  user,
  onOpenMobileMenu,
  totalCount = 0,
  items = [],
}: AdminTopbarProps) {
  const fa = locale === "fa"
  const pathname = usePathname()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [popoverOpen])

  // Close popover when pathname changes
  useEffect(() => {
    setPopoverOpen(false)
  }, [pathname])

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const relevant = segments[0] === locale ? segments.slice(1) : segments

    const items: Array<{ href?: string; label: string }> = [
      { href: `/${locale}/admin/dashboard`, label: fa ? "مدیریت" : "Admin" },
    ]

    let accumulated = `/${locale}`
    for (let i = 1; i < relevant.length; i++) {
      const seg = relevant[i]
      accumulated += `/${seg}`
      const isLast = i === relevant.length - 1
      const mapped = ROUTE_LABELS[seg]
      const label = mapped ? (fa ? mapped.fa : mapped.en) : seg

      items.push({
        href: isLast ? undefined : accumulated,
        label,
      })
    }

    return items
  }, [pathname, locale, fa])

  const userInitial = (user.name?.[0] || user.email?.[0] || "A").toUpperCase()
  const userName = user.name || user.email || (fa ? "مدیر سیستم" : "Admin")

  return (
    <header className={styles["web-adm-tb__root"]}>
      {/* Start: Toggle & Breadcrumb */}
      <div className={styles["web-adm-tb__start"]}>
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={styles["web-adm-tb__toggle-btn"]}
          aria-label={fa ? "باز کردن منو" : "Open navigation menu"}
        >
          <Menu style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
        </button>

        <nav aria-label={fa ? "مسیر جاری" : "Current location"}>
          <ol className={styles["web-adm-tb__breadcrumb"]} role="list">
            {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <li className={styles["web-adm-tb__breadcrumb-sep"]} aria-hidden="true">
                      {fa ? (
                        <ChevronLeft style={{ width: "0.875rem", height: "0.875rem" }} />
                      ) : (
                        <ChevronRight style={{ width: "0.875rem", height: "0.875rem" }} />
                      )}
                    </li>
                  )}
                  <li>
                    {crumb.href ? (
                      <Link href={crumb.href} className={styles["web-adm-tb__breadcrumb-item"]}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={styles["web-adm-tb__breadcrumb-current"]} aria-current="page">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                </React.Fragment>
            ))}
          </ol>
        </nav>
      </div>

      {/* End: Notification & User */}
      <div className={styles["web-adm-tb__end"]}>
        <div className={styles["web-adm-tb__notif-wrapper"]} ref={notifRef}>
          <button
            type="button"
            className={[
              styles["web-adm-tb__notif-btn"],
              popoverOpen ? styles["web-adm-tb__notif-btn--active"] : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={fa ? "اعلان‌ها" : "Notifications"}
            aria-expanded={popoverOpen}
            onClick={() => setPopoverOpen((prev) => !prev)}
          >
            <Bell style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden="true" />
            {totalCount > 0 && (
              <span className={styles["web-adm-tb__notif-badge"]}>
                {totalCount > 99
                  ? "۹۹+"
                  : fa
                  ? totalCount.toLocaleString("fa-IR")
                  : totalCount}
              </span>
            )}
          </button>

          {popoverOpen && (
            <div className={styles["web-adm-tb__popover"]}>
              <div className={styles["web-adm-tb__popover-header"]}>
                <span className={styles["web-adm-tb__popover-title"]}>
                  {fa ? "رویدادها و اعلان‌های اخیر" : "Recent Activity"}
                </span>
                {totalCount > 0 && (
                  <span className={styles["web-adm-tb__popover-count"]}>
                    {fa
                      ? `${totalCount.toLocaleString("fa-IR")} مورد نیازمند بررسی`
                      : `${totalCount} pending`}
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className={styles["web-adm-tb__popover-empty"]}>
                  {fa ? "هیچ رویداد جدیدی یافت نشد" : "No recent activity"}
                </div>
              ) : (
                <ul className={styles["web-adm-tb__popover-list"]}>
                  {items.map((item) => {
                    const fullHref = `/${locale}${item.href}`
                    const Icon =
                      item.kind === "order"
                        ? ShoppingCart
                        : item.kind === "quote"
                        ? MessageSquare
                        : item.kind === "contact"
                        ? LifeBuoy
                        : item.kind === "price"
                        ? TrendingUp
                        : Package

                    return (
                      <li key={item.id} className={styles["web-adm-tb__popover-item"]}>
                        <Link
                          href={fullHref}
                          className={styles["web-adm-tb__popover-link"]}
                          onClick={() => setPopoverOpen(false)}
                        >
                          <div className={styles["web-adm-tb__popover-icon"]}>
                            <Icon style={{ width: "1rem", height: "1rem" }} />
                          </div>
                          <div className={styles["web-adm-tb__popover-content"]}>
                            <span className={styles["web-adm-tb__popover-label"]}>
                              {item.label}
                            </span>
                            <span className={styles["web-adm-tb__popover-time"]}>
                              <Clock
                                style={{
                                  width: "0.75rem",
                                  height: "0.75rem",
                                  display: "inline-block",
                                  verticalAlign: "middle",
                                  marginInlineEnd: "0.25rem",
                                }}
                              />
                              {formatRelativeFa(item.createdAt)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className={styles["web-adm-tb__user"]}>
          <div className={styles["web-adm-tb__avatar"]}>{userInitial}</div>
          <span className={styles["web-adm-tb__user-name"]} title={user.email ?? ""}>
            {userName}
          </span>
        </div>
      </div>
    </header>
  )
}
