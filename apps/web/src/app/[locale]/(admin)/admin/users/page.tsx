import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { formatRelativeTime } from "@/lib/cement"

export const metadata: Metadata = { title: "کاربران | پنل مدیریت تیراژه" }

const PAGE_SIZE = 25

const CUSTOMER_TYPE_LABEL: Record<string, { fa: string; en: string }> = {
  NORMAL:     { fa: "عادی",      en: "Normal"     },
  CONTRACTOR: { fa: "پیمانکار",  en: "Contractor" },
  COMPANY:    { fa: "شرکت",      en: "Company"    },
}

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

  return (
    <>
      <div className="au-header">
        <div>
          <h1 className="au-title">{fa ? "کاربران" : "Users"}</h1>
          <p className="au-count tabular">
            {fa ? `${total.toLocaleString("fa-IR")} کاربر` : `${total.toLocaleString()} users`}
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" action={`/${locale}/admin/users`} className="au-search-wrap">
        <Search className="au-search__icon" aria-hidden="true" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={fa ? "نام، ایمیل یا شماره تلفن..." : "Name, email, or phone..."}
          className="au-search"
          aria-label={fa ? "جستجو" : "Search"}
        />
      </form>

      {/* Table */}
      <div className="au-table-wrap">
        <table className="au-table" role="table">
          <thead>
            <tr>
              <th scope="col">{fa ? "نام" : "Name"}</th>
              <th scope="col">{fa ? "ایمیل / تلفن" : "Email / Phone"}</th>
              <th scope="col">{fa ? "نقش" : "Role"}</th>
              <th scope="col">{fa ? "نوع مشتری" : "Customer Type"}</th>
              <th scope="col">{fa ? "وضعیت" : "Status"}</th>
              <th scope="col">{fa ? "تاریخ عضویت" : "Joined"}</th>
            </tr>
          </thead>
          <tbody>
            {(users as any[]).map((user) => {
              const typeLabel = CUSTOMER_TYPE_LABEL[user.customerType as string] ?? { fa: user.customerType, en: user.customerType }
              return (
                <tr key={user.id}>
                  <td>
                    <span className="au-table__name">{user.name}</span>
                  </td>
                  <td className="au-table__contact">
                    {user.email && <span className="au-table__email">{user.email}</span>}
                    {user.phone && <span className="au-table__phone">{user.phone}</span>}
                  </td>
                  <td>
                    <span className="au-role-badge">
                      {user.role?.displayName ?? user.role?.name ?? "—"}
                    </span>
                  </td>
                  <td className="au-table__secondary">
                    {fa ? typeLabel.fa : typeLabel.en}
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? "status-badge--success" : "status-badge--danger"}`}>
                      {user.isActive
                        ? (fa ? "فعال" : "Active")
                        : (fa ? "غیرفعال" : "Inactive")}
                    </span>
                  </td>
                  <td className="au-table__secondary tabular">
                    {formatRelativeTime(user.createdAt, locale)}
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="au-table__empty">
                  {fa ? "کاربری یافت نشد" : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="au-pagination">
          {page > 1 && (
            <Link href={buildUrl(page - 1)} className="au-page-btn">
              {fa ? "قبلی" : "Prev"}
            </Link>
          )}
          <span className="au-page-info tabular">
            {fa
              ? `صفحه ${page.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}`
              : `Page ${page} of ${totalPages}`}
          </span>
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} className="au-page-btn">
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}

      <style>{`
        .au-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
        .au-title { font-size: 1.5rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em; }
        .au-count { font-size: 0.875rem; color: var(--color-text-muted); margin-top: 0.2rem; }

        .au-search-wrap { position: relative; display: flex; align-items: center; max-width: 28rem; margin-bottom: 1.25rem; }
        .au-search__icon { position: absolute; inset-inline-start: 0.75rem; width: 0.9rem; height: 0.9rem; color: var(--color-text-muted); pointer-events: none; }
        .au-search {
          width: 100%;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 0.5625rem 0.875rem;
          padding-inline-start: 2.25rem;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color var(--transition-fast);
        }
        .au-search::placeholder { color: var(--color-text-muted); }
        .au-search:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent); }

        .au-table-wrap { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow-x: auto; margin-bottom: 1.25rem; }
        .au-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .au-table thead th { padding: 0.75rem 1rem; text-align: start; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); white-space: nowrap; }
        .au-table tbody td { padding: 0.75rem 1rem; color: var(--color-text); border-top: 1px solid var(--color-border-subtle); white-space: nowrap; }
        .au-table tbody tr:first-child td { border-top: none; }
        .au-table tbody tr:hover td { background-color: var(--color-background); }
        .au-table__name { font-weight: 600; }
        .au-table__contact { display: flex; flex-direction: column; gap: 0.1rem; }
        .au-table__email { font-size: 0.8125rem; color: var(--color-text-secondary); }
        .au-table__phone { font-size: 0.75rem; color: var(--color-text-muted); direction: ltr; unicode-bidi: isolate; }
        .au-table__secondary { color: var(--color-text-secondary); }
        .au-table__empty { text-align: center; color: var(--color-text-muted); padding: 3rem !important; }

        .au-role-badge { display: inline-flex; align-items: center; padding: 0.175rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.6875rem; font-weight: 700; background-color: var(--color-border-subtle); color: var(--color-text-secondary); border: 1px solid var(--color-border); }

        .status-badge { display: inline-flex; align-items: center; padding: 0.175rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700; white-space: nowrap; }
        .status-badge--success { background-color: var(--color-success-subtle); color: var(--color-success); }
        .status-badge--warning { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .status-badge--danger  { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .status-badge--info    { background-color: var(--color-accent-subtle);  color: var(--color-accent);  }

        .au-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; }
        .au-page-btn { padding: 0.5rem 1rem; background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 600; color: var(--color-text-secondary); text-decoration: none; transition: background-color var(--transition-fast), border-color var(--transition-fast); }
        .au-page-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .au-page-info { font-size: 0.875rem; color: var(--color-text-muted); }
        .tabular { font-variant-numeric: tabular-nums; }
      `}</style>
    </>
  )
}
