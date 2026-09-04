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
  X,
} from "lucide-react"

interface AdminNavProps {
  locale: string
  fa: boolean
  onClose?: () => void
}

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard, fa: "داشبورد",           en: "Dashboard"     },
  { key: "products",  href: "/admin/products",  icon: Package,          fa: "محصولات",            en: "Products"      },
  { key: "orders",    href: "/admin/orders",    icon: ShoppingBag,      fa: "سفارش‌ها",           en: "Orders"        },
  { key: "users",     href: "/admin/users",     icon: Users,            fa: "کاربران",            en: "Users"         },
  { key: "categories",href: "/admin/categories",icon: Tag,              fa: "دسته‌بندی‌ها",        en: "Categories"    },
  { key: "brands",    href: "/admin/brands",    icon: Building2,        fa: "برندها",             en: "Brands"        },
  { key: "blog",      href: "/admin/blog",      icon: FileText,         fa: "مقالات",             en: "Blog"          },
  { key: "quotes",    href: "/admin/quotes",    icon: MessageSquare,    fa: "درخواست‌های قیمت",   en: "Quotes"        },
] as const

export function AdminNav({ locale, fa, onClose }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="admin-nav" aria-label={fa ? "منوی مدیریت" : "Admin navigation"}>
      {/* Logo + close button */}
      <div className="admin-nav__header">
        <Link href={`/${locale}/admin/dashboard`} className="admin-nav__logo">
          <Package style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          <span>{fa ? "پنل مدیریت" : "Admin Panel"}</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="admin-nav__close"
            aria-label={fa ? "بستن منو" : "Close menu"}
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <ul className="admin-nav__list" role="list">
        {NAV_ITEMS.map(({ key, href, icon: Icon, fa: faLabel, en: enLabel }) => {
          const fullHref = `/${locale}${href}`
          const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)
          return (
            <li key={key}>
              <Link
                href={fullHref}
                aria-current={isActive ? "page" : undefined}
                className={`admin-nav__link ${isActive ? "admin-nav__link--active" : ""}`}
              >
                <Icon style={{ width: "1rem", height: "1rem", flexShrink: 0 }} aria-hidden="true" />
                <span>{fa ? faLabel : enLabel}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <style>{`
        .admin-nav {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
        }
        .admin-nav__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1rem;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .admin-nav__logo {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--color-accent);
          text-decoration: none;
          letter-spacing: -0.01em;
        }
        .admin-nav__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: var(--radius-md);
          border: none;
          background: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .admin-nav__close:hover { background-color: var(--color-border-subtle); }

        .admin-nav__list {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          padding: 0.75rem 0.5rem;
          flex: 1;
          list-style: none;
          margin: 0;
          padding-inline: 0.5rem;
        }
        .admin-nav__link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        .admin-nav__link:hover {
          background-color: var(--color-border-subtle);
          color: var(--color-text);
        }
        .admin-nav__link--active {
          background-color: var(--color-accent-subtle);
          color: var(--color-accent);
          font-weight: 700;
        }
        .admin-nav__link:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
      `}</style>
    </nav>
  )
}
