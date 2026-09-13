"use client"

import React, { useState } from "react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"
import { ToastProvider } from "@/components/admin/Toast"
import styles from "@/components/admin/AdminShell.module.css"

interface AdminShellProps {
  locale: string
  user: { name?: string | null; email?: string | null; roleName?: string | null; permissions?: string[] }
  children: React.ReactNode
}

export function AdminShell({ locale, user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const fa = locale === "fa"

  return (
    <ToastProvider>
      <div className={styles["web-adm__root"]} dir={fa ? "rtl" : "ltr"}>
        {/* Sticky / Off-canvas Sidebar */}
        <AdminSidebar
          locale={locale}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          userPermissions={user.permissions}
        />

        {/* Main Column */}
        <div className={styles["web-adm__main"]}>
          {/* Topbar */}
          <AdminTopbar
            locale={locale}
            user={user}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />

          {/* Main Content Area */}
          <main className={styles["web-adm__content"]} id="admin-main">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
