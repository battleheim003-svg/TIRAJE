import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { AdminShell } from "./admin/admin-shell"

import { getAdminCounts } from "@/lib/admin-counts"
import { getRecentActivity } from "@/lib/admin-activity"

const ADMIN_ROLES = ["admin", "super_admin"]

interface AdminUser {
  id?: string
  name?: string | null
  email?: string | null
  roleName?: string | null
  permissions?: string[]
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/admin/dashboard`)
  }

  const user = session.user as AdminUser
  const roleName = user.roleName
  if (!roleName || !ADMIN_ROLES.includes(roleName)) {
    redirect(`/${locale}`)
  }

  const [counts, activity] = await Promise.all([
    getAdminCounts(),
    getRecentActivity(),
  ])

  return (
    <AdminShell locale={locale} user={user} counts={counts} activity={activity}>
      {children}
    </AdminShell>
  )
}
