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
  const isArchived = (Array.isArray(sp.archived) ? sp.archived[0] : sp.archived) === "true"
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))

  const where: Record<string, unknown> = {}
  if (isArchived) {
    where.archivedAt = { not: null }
  } else {
    where.archivedAt = null
  }

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
    if (isArchived) params.set("archived", "true")
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
    archivedAt: u.archivedAt,
    role: u.role,
  }))

  return (
    <div className={styles["web-adm-usr__wrapper"]}>
      <div className={styles["web-adm-usr__header"]}>
        <div>
          <h1 className={styles["web-adm-usr__title"]}>
            {fa ? (isArchived ? "کاربران آرشیو شده" : "کاربران") : (isArchived ? "Archived Users" : "Users")}
          </h1>
          <p className={styles["web-adm-usr__count"]}>
            {fa ? `${total.toLocaleString("fa-IR")} کاربر` : `${total.toLocaleString()} users`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <Link
          href={`/${locale}/admin/users${q ? `?q=${q}` : ""}`}
          style={{
            padding: "0.4rem 0.85rem",
            borderRadius: "0.375rem",
            fontWeight: !isArchived ? 600 : 400,
            fontSize: "0.85rem",
            textDecoration: "none",
            backgroundColor: !isArchived ? "var(--color-primary-subtle, rgba(0,0,0,0.06))" : "transparent",
            color: !isArchived ? "var(--color-primary, #0284c7)" : "var(--color-text-secondary, #64748b)",
          }}
        >
          {fa ? "کاربران فعال" : "Active Users"}
        </Link>
        <Link
          href={`/${locale}/admin/users?archived=true${q ? `&q=${q}` : ""}`}
          style={{
            padding: "0.4rem 0.85rem",
            borderRadius: "0.375rem",
            fontWeight: isArchived ? 600 : 400,
            fontSize: "0.85rem",
            textDecoration: "none",
            backgroundColor: isArchived ? "var(--color-primary-subtle, rgba(0,0,0,0.06))" : "transparent",
            color: isArchived ? "var(--color-primary, #0284c7)" : "var(--color-text-secondary, #64748b)",
          }}
        >
          {fa ? "آرشیو شده" : "Archived"}
        </Link>
      </div>

      {/* Search */}
      <form method="GET" action={`/${locale}/admin/users`} className={styles["web-adm-usr__searchWrap"]}>
        {isArchived && <input type="hidden" name="archived" value="true" />}
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
        isArchived={isArchived}
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
