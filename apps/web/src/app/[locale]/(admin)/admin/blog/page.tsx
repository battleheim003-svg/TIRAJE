import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import { formatJalali } from "@tirajeh/shared"
import PostActions from "./post-actions"
import styles from "./BlogList.module.css"

export const metadata: Metadata = { title: "مقالات | پنل مدیریت تیراژه" }

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, { fa: string; en: string; variant: "warning" | "success" | "info" | "neutral" }> = {
  DRAFT:     { fa: "پیش‌نویس",   en: "Draft",     variant: "warning" },
  PUBLISHED: { fa: "منتشر شده", en: "Published",  variant: "success" },
  SCHEDULED: { fa: "زمان‌بندی",  en: "Scheduled", variant: "info"    },
  ARCHIVED:  { fa: "بایگانی",   en: "Archived",   variant: "neutral" },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminBlogPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))
  const statusFilter = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? ""
  const isArchived = (Array.isArray(sp.archived) ? sp.archived[0] : sp.archived) === "true"

  const where: Record<string, unknown> = {}
  if (isArchived) {
    where.archivedAt = { not: null }
  } else {
    where.archivedAt = null
  }
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

  function buildPageUrl(p: number) {
    const params = new URLSearchParams()
    if (isArchived) params.set("archived", "true")
    if (statusFilter) params.set("status", statusFilter)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/${locale}/admin/blog${qs ? `?${qs}` : ""}`
  }

  return (
    <div className={styles["web-adm-blg__wrapper"]}>
      {/* Header */}
      <div className={styles["web-adm-blg__header"]}>
        <div>
          <h1 className={styles["web-adm-blg__title"]}>
            {fa ? (isArchived ? "مقالات آرشیو شده" : "مقالات") : (isArchived ? "Archived Blog Posts" : "Blog Posts")}
          </h1>
          <p className={styles["web-adm-blg__count"]}>{fa ? `${total} مقاله` : `${total} posts`}</p>
        </div>
        {!isArchived && (
          <Link href={`/${locale}/admin/blog/new`} className={styles["web-adm-blg__addBtn"]}>
            <Plus style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            {fa ? "مقاله جدید" : "New Post"}
          </Link>
        )}
      </div>

      {/* Archive Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <Link
          href={`/${locale}/admin/blog${statusFilter ? `?status=${statusFilter}` : ""}`}
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
          {fa ? "مقالات فعال" : "Active Posts"}
        </Link>
        <Link
          href={`/${locale}/admin/blog?archived=true${statusFilter ? `&status=${statusFilter}` : ""}`}
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

      {/* Status filter */}
      <div className={styles["web-adm-blg__filters"]}>
        {[["", fa ? "همه" : "All"], ["DRAFT", fa ? "پیش‌نویس" : "Draft"], ["PUBLISHED", fa ? "منتشر" : "Published"], ["SCHEDULED", fa ? "زمان‌بندی" : "Scheduled"], ["ARCHIVED", fa ? "بایگانی" : "Archived"]].map(([val, label]) => {
          const params = new URLSearchParams()
          if (isArchived) params.set("archived", "true")
          if (val) params.set("status", val)
          const qs = params.toString()
          return (
            <Link
              key={val}
              href={`/${locale}/admin/blog${qs ? `?${qs}` : ""}`}
              className={`${styles["web-adm-blg__filterTab"]}${statusFilter === val ? ` ${styles["web-adm-blg__filterTab--active"]}` : ""}`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {posts.length === 0 ? (
        <div className={styles["web-adm-blg__empty"]}>
          <FileText style={{ width: "2.5rem", height: "2.5rem" }} strokeWidth={1.5} aria-hidden="true" />
          <p>{fa ? "هیچ مقاله‌ای یافت نشد." : "No posts found."}</p>
        </div>
      ) : (
        <div className={styles["web-adm-blg__tableWrap"]}>
          <table className={styles["web-adm-blg__table"]}>
            <thead>
              <tr>
                <th className={styles["web-adm-blg__th"]}>{fa ? "عنوان" : "Title"}</th>
                <th className={styles["web-adm-blg__th"]}>{fa ? "دسته" : "Category"}</th>
                <th className={styles["web-adm-blg__th"]}>{fa ? "نویسنده" : "Author"}</th>
                <th className={`${styles["web-adm-blg__th"]} ${styles["web-adm-blg__thCenter"]}`}>{fa ? "وضعیت" : "Status"}</th>
                <th className={`${styles["web-adm-blg__th"]} ${styles["web-adm-blg__thCenter"]}`}>{fa ? "بازدید" : "Views"}</th>
                <th className={styles["web-adm-blg__th"]}>{fa ? "تاریخ" : "Date"}</th>
                <th className={styles["web-adm-blg__th"]}></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post: PostRow) => {
                const sl = STATUS_LABEL[post.status] ?? { fa: post.status, en: post.status, variant: "secondary" as const }
                return (
                  <tr key={post.id} className={styles["web-adm-blg__row"]}>
                    <td className={styles["web-adm-blg__td"]}>
                      <div className={styles["web-adm-blg__titleCell"]}>
                        <span className={styles["web-adm-blg__postTitle"]}>{fa ? post.titleFa : (post.titleEn ?? post.titleFa)}</span>
                        <code className={styles["web-adm-blg__slug"]}>{post.slug}</code>
                      </div>
                    </td>
                    <td className={`${styles["web-adm-blg__td"]} ${styles["web-adm-blg__muted"]}`}>
                      {post.category ? (fa ? post.category.nameFa : (post.category.nameEn ?? post.category.nameFa)) : "—"}
                    </td>
                    <td className={`${styles["web-adm-blg__td"]} ${styles["web-adm-blg__muted"]}`}>{post.author.name ?? "—"}</td>
                    <td className={`${styles["web-adm-blg__td"]} ${styles["web-adm-blg__thCenter"]}`}>
                      <Badge variant={sl.variant}>
                        {fa ? sl.fa : sl.en}
                      </Badge>
                    </td>
                    <td className={`${styles["web-adm-blg__td"]} ${styles["web-adm-blg__num"]}`}>{post.viewCount.toLocaleString()}</td>
                    <td className={`${styles["web-adm-blg__td"]} ${styles["web-adm-blg__date"]}`}>
                      {formatJalali(post.publishedAt ?? post.createdAt)}
                    </td>
                    <td className={styles["web-adm-blg__td"]} style={{ textAlign: "end" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                        {!isArchived && (
                          <Link href={`/${locale}/admin/blog/${post.id}`} className={styles["web-adm-blg__editBtn"]}>
                            {fa ? "ویرایش" : "Edit"}
                          </Link>
                        )}
                        <PostActions postId={post.id} fa={fa} isArchived={isArchived} />
                      </div>
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
        <div className={styles["web-adm-blg__pagination"]}>
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)} className={styles["web-adm-blg__pageBtn"]}>
              {fa ? "قبلی" : "Previous"}
            </Link>
          )}
          <span className={styles["web-adm-blg__pageInfo"]}>{fa ? `صفحه ${page} از ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
          {page < totalPages && (
            <Link href={buildPageUrl(page + 1)} className={styles["web-adm-blg__pageBtn"]}>
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
