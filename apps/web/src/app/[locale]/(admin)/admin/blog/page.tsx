import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { formatRelativeTime } from "@/lib/cement"

export const metadata: Metadata = { title: "مقالات | پنل مدیریت تیراژه" }

const PAGE_SIZE = 20

const STATUS_LABEL = {
  DRAFT:     { fa: "پیش‌نویس",   en: "Draft",     variant: "warn"    },
  PUBLISHED: { fa: "منتشر شده", en: "Published",  variant: "success" },
  SCHEDULED: { fa: "زمان‌بندی",  en: "Scheduled", variant: "info"    },
  ARCHIVED:  { fa: "بایگانی",   en: "Archived",   variant: "muted"   },
} as const

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminBlogPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))
  const statusFilter = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? ""

  const where: Record<string, unknown> = {}
  if (statusFilter) where.status = statusFilter

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        titleFa: true,
        titleEn: true,
        slug: true,
        status: true,
        publishedAt: true,
        viewCount: true,
        readingTimeMin: true,
        createdAt: true,
        author: { select: { name: true } },
        category: { select: { nameFa: true, nameEn: true } },
      },
    }),
    db.post.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  type PostRow = (typeof posts)[number]

  return (
    <>
      <div className="ablog-root">
        {/* Header */}
        <div className="ablog-header">
          <div>
            <h1 className="ablog-title">{fa ? "مقالات" : "Blog Posts"}</h1>
            <p className="ablog-sub">{fa ? `${total} مقاله` : `${total} posts`}</p>
          </div>
          <Link href={`/${locale}/admin/blog/new`} className="ablog-btn-new">
            <Plus size={16} />
            {fa ? "مقاله جدید" : "New Post"}
          </Link>
        </div>

        {/* Status filter */}
        <div className="ablog-filters">
          {[["", fa ? "همه" : "All"], ["DRAFT", fa ? "پیش‌نویس" : "Draft"], ["PUBLISHED", fa ? "منتشر" : "Published"], ["SCHEDULED", fa ? "زمان‌بندی" : "Scheduled"], ["ARCHIVED", fa ? "بایگانی" : "Archived"]].map(([val, label]) => (
            <Link
              key={val}
              href={`/${locale}/admin/blog${val ? `?status=${val}` : ""}`}
              className={`ablog-filter${statusFilter === val ? " ablog-filter--active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Table */}
        {posts.length === 0 ? (
          <div className="ablog-empty">
            <FileText size={40} strokeWidth={1.5} />
            <p>{fa ? "هیچ مقاله‌ای یافت نشد." : "No posts found."}</p>
          </div>
        ) : (
          <div className="ablog-card">
            <table className="ablog-table">
              <thead>
                <tr>
                  <th>{fa ? "عنوان" : "Title"}</th>
                  <th>{fa ? "دسته" : "Category"}</th>
                  <th>{fa ? "نویسنده" : "Author"}</th>
                  <th className="ablog-th-center">{fa ? "وضعیت" : "Status"}</th>
                  <th className="ablog-th-center">{fa ? "بازدید" : "Views"}</th>
                  <th>{fa ? "تاریخ" : "Date"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post: PostRow) => {
                  const sl = STATUS_LABEL[post.status as keyof typeof STATUS_LABEL] ?? { fa: post.status, en: post.status, variant: "muted" }
                  return (
                    <tr key={post.id}>
                      <td className="ablog-title-cell">
                        <span className="ablog-post-title">{fa ? post.titleFa : (post.titleEn ?? post.titleFa)}</span>
                        <code className="ablog-slug">{post.slug}</code>
                      </td>
                      <td className="ablog-muted">{post.category ? (fa ? post.category.nameFa : (post.category.nameEn ?? post.category.nameFa)) : "—"}</td>
                      <td className="ablog-muted">{post.author.name ?? "—"}</td>
                      <td className="ablog-th-center">
                        <span className={`ablog-badge ablog-badge--${sl.variant}`}>{fa ? sl.fa : sl.en}</span>
                      </td>
                      <td className="ablog-th-center ablog-num">{post.viewCount.toLocaleString()}</td>
                      <td className="ablog-date">
                        {formatRelativeTime(post.publishedAt ?? post.createdAt, fa ? "fa" : "en")}
                      </td>
                      <td className="ablog-actions">
                        <Link href={`/${locale}/admin/blog/${post.id}`} className="ablog-link">{fa ? "ویرایش" : "Edit"}</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="ablog-pager">
            {page > 1 && (
              <Link href={`/${locale}/admin/blog?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`} className="ablog-pager-btn">
                {fa ? "قبلی" : "Previous"}
              </Link>
            )}
            <span className="ablog-pager-info">{fa ? `صفحه ${page} از ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
            {page < totalPages && (
              <Link href={`/${locale}/admin/blog?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`} className="ablog-pager-btn">
                {fa ? "بعدی" : "Next"}
              </Link>
            )}
          </div>
        )}
      </div>

      <style>{`
        .ablog-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .ablog-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
        .ablog-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
        .ablog-sub { font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.2rem; }
        .ablog-btn-new { display: inline-flex; align-items: center; gap: 0.375rem; background-color: var(--color-accent); color: #fff; font-size: 0.875rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: var(--radius-md); text-decoration: none; white-space: nowrap; transition: background-color var(--transition-fast); }
        .ablog-btn-new:hover { background-color: var(--color-accent-hover); }
        .ablog-filters { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .ablog-filter { font-size: 0.8125rem; padding: 0.3125rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); color: var(--color-text-secondary); text-decoration: none; transition: border-color var(--transition-fast), color var(--transition-fast); }
        .ablog-filter:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .ablog-filter--active { border-color: var(--color-accent); color: var(--color-accent); background-color: color-mix(in srgb, var(--color-accent) 8%, transparent); }
        .ablog-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; color: var(--color-text-muted); background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-align: center; }
        .ablog-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; overflow-x: auto; }
        .ablog-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .ablog-table th { padding: 0.625rem 0.875rem; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); text-align: start; white-space: nowrap; }
        .ablog-th-center { text-align: center !important; }
        .ablog-table td { padding: 0.625rem 0.875rem; border-bottom: 1px solid var(--color-border); vertical-align: middle; color: var(--color-text); }
        .ablog-table tbody tr:last-child td { border-bottom: none; }
        .ablog-title-cell { display: flex; flex-direction: column; gap: 0.2rem; }
        .ablog-post-title { font-weight: 500; }
        .ablog-slug { font-size: 0.7rem; font-family: monospace; color: var(--color-text-muted); direction: ltr; }
        .ablog-muted { color: var(--color-text-muted); font-size: 0.8125rem; }
        .ablog-num { font-variant-numeric: tabular-nums; }
        .ablog-date { font-size: 0.8125rem; color: var(--color-text-muted); white-space: nowrap; }
        .ablog-badge { display: inline-block; font-size: 0.6875rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 999px; }
        .ablog-badge--success { color: var(--color-success); background-color: var(--color-success-subtle); }
        .ablog-badge--warn { color: var(--color-warning, #b45309); background-color: var(--color-warning-subtle, #fef3c7); }
        .ablog-badge--info { color: var(--color-info, #0369a1); background-color: var(--color-info-subtle, #e0f2fe); }
        .ablog-badge--muted { color: var(--color-text-muted); background-color: var(--color-border); }
        .ablog-actions { white-space: nowrap; text-align: end; }
        .ablog-link { font-size: 0.8125rem; color: var(--color-accent); text-decoration: none; }
        .ablog-link:hover { text-decoration: underline; }
        .ablog-pager { display: flex; align-items: center; justify-content: center; gap: 1rem; }
        .ablog-pager-btn { font-size: 0.875rem; color: var(--color-accent); text-decoration: none; }
        .ablog-pager-btn:hover { text-decoration: underline; }
        .ablog-pager-info { font-size: 0.8125rem; color: var(--color-text-muted); }
      `}</style>
    </>
  )
}
