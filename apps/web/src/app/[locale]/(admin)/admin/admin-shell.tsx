"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, LogOut, ExternalLink } from "lucide-react"
import { signOut } from "next-auth/react"
import { AdminNav } from "./admin-nav"

interface AdminShellProps {
  locale: string
  user: { name?: string | null; email?: string | null; roleName?: string | null }
  children: React.ReactNode
}

export function AdminShell({ locale, user, children }: AdminShellProps) {
  const fa = locale === "fa"
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="admin-shell" dir={fa ? "rtl" : "ltr"}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="admin-overlay"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : ""}`}
        aria-label={fa ? "نوار کناری مدیریت" : "Admin sidebar"}
      >
        <AdminNav locale={locale} fa={fa} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="admin-topbar__menu"
            aria-label={fa ? "باز کردن منو" : "Open menu"}
            aria-expanded={sidebarOpen}
          >
            <Menu style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          </button>

          <div className="admin-topbar__right">
            {/* Storefront link */}
            <Link
              href={`/${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-topbar__btn"
              title={fa ? "مشاهده سایت" : "View storefront"}
            >
              <ExternalLink style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              <span className="admin-topbar__btn-label">{fa ? "سایت" : "Site"}</span>
            </Link>

            {/* User info */}
            <span className="admin-topbar__user" title={user.email ?? ""}>
              {user.name ?? user.email ?? "Admin"}
            </span>

            {/* Sign out */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
              className="admin-topbar__btn admin-topbar__btn--danger"
              title={fa ? "خروج" : "Sign out"}
            >
              <LogOut style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              <span className="admin-topbar__btn-label">{fa ? "خروج" : "Sign out"}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content" id="admin-main">
          {children}
        </main>
      </div>

      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100vh;
          background-color: var(--color-background);
        }

        /* sidebar */
        .admin-sidebar {
          width: 15rem;
          flex-shrink: 0;
          background-color: var(--color-surface);
          border-inline-end: 1px solid var(--color-border);
          position: fixed;
          inset-block: 0;
          inset-inline-start: 0;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.22s ease;
        }
        [dir="rtl"] .admin-sidebar { transform: translateX(100%); }
        .admin-sidebar--open { transform: translateX(0) !important; }
        @media (min-width: 1024px) {
          .admin-sidebar {
            position: sticky;
            top: 0;
            height: 100vh;
            transform: none !important;
          }
        }

        /* mobile overlay */
        .admin-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          background-color: rgba(0,0,0,0.45);
        }
        @media (min-width: 1024px) { .admin-overlay { display: none; } }

        /* main */
        .admin-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        /* top bar */
        .admin-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 3.5rem;
          padding-inline: 1.25rem;
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          gap: 1rem;
        }
        .admin-topbar__menu {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-md);
          border: none;
          background: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }
        .admin-topbar__menu:hover { background-color: var(--color-border-subtle); }
        @media (min-width: 1024px) { .admin-topbar__menu { display: none; } }

        .admin-topbar__right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-inline-start: auto;
        }
        .admin-topbar__user {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          max-width: 12rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: none;
        }
        @media (min-width: 640px) { .admin-topbar__user { display: block; } }

        .admin-topbar__btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.625rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-decoration: none;
          border: none;
          background: none;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        .admin-topbar__btn:hover { background-color: var(--color-border-subtle); color: var(--color-text); }
        .admin-topbar__btn--danger:hover { background-color: var(--color-danger-subtle); color: var(--color-danger); }
        .admin-topbar__btn-label { display: none; }
        @media (min-width: 640px) { .admin-topbar__btn-label { display: inline; } }

        /* content */
        .admin-content {
          flex: 1;
          padding: 1.5rem;
          overflow-x: hidden;
        }
        @media (min-width: 768px) { .admin-content { padding: 2rem; } }
      `}</style>
    </div>
  )
}
