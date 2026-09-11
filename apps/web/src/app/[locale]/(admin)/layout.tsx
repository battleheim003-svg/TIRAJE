import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { auth } from "@tirajeh/auth"
import { AdminShell } from "./admin/admin-shell"

const ADMIN_ROLES = ["admin", "super_admin"]

interface AdminUser {
  id?: string
  name?: string | null
  email?: string | null
  roleName?: string | null
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

  return <AdminShell locale={locale} user={user}>{children}</AdminShell>
}
