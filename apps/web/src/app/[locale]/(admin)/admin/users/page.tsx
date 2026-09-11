import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { UsersTableClient, UserRow } from "@/components/admin/UsersTableClient"
import styles from "./Users.module.css"

export const metadata: Metadata = { title: "کاربران | پنل مدیریت تیراژه" }

const PAGE_SIZE = 25

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminUsersPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams

  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? ""
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))

  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { role: { select: { name: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/${locale}/admin/users${qs ? `?${qs}` : ""}`
  }

  const mappedUsers: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    customerType: u.customerType,
    isActive: u.isActive,
    createdAt: u.createdAt,
    role: u.role,
  }))

  return (
    <div className={styles["web-adm-usr__wrapper"]}>
      <div className={styles["web-adm-usr__header"]}>
        <div>
          <h1 className={styles["web-adm-usr__title"]}>{fa ? "کاربران" : "Users"}</h1>
          <p className={styles["web-adm-usr__count"]}>
            {fa ? `${total.toLocaleString("fa-IR")} کاربر` : `${total.toLocaleString()} users`}
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" action={`/${locale}/admin/users`} className={styles["web-adm-usr__searchWrap"]}>
        <Search
          style={{
            width: "0.9rem",
            height: "0.9rem",
          }}
          className={styles["web-adm-usr__searchIcon"]}
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={fa ? "نام، ایمیل یا شماره تلفن..." : "Name, email, or phone..."}
          className={styles["web-adm-usr__searchInput"]}
          aria-label={fa ? "جستجو" : "Search"}
        />
      </form>

      {/* DataTable */}
      <UsersTableClient
        users={mappedUsers}
        locale={locale}
        fa={fa}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles["web-adm-usr__pagination"]}>
          {page > 1 && (
            <Link href={buildUrl(page - 1)} className={styles["web-adm-usr__pageBtn"]}>
              {fa ? "قبلی" : "Prev"}
            </Link>
          )}
          <span className={styles["web-adm-usr__pageInfo"]}>
            {fa
              ? `صفحه ${page.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}`
              : `Page ${page} of ${totalPages}`}
          </span>
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} className={styles["web-adm-usr__pageBtn"]}>
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
