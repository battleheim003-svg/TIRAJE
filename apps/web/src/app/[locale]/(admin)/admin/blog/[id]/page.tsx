import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"
import { formatRelativeTime } from "@/lib/cement"
import { PostForm } from "../post-form"
export const metadata: Metadata = { title: "ویرایش مقاله | پنل مدیریت تیراژه" }
type Props = { params: Promise<{ id: string }> }
export default async function AdminBlogEditPage({ params }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const { id } = await params
  const [post, categories] = await Promise.all([
    db.post.findUnique({
      where: { id },
      select: {
        id: true,
        titleFa: true,
        titleEn: true,
        slug: true,
        contentFa: true,
        contentEn: true,
        excerptFa: true,
        excerptEn: true,
        featuredImage: true,
        categoryId: true,
        status: true,
        publishedAt: true,
        seoTitle: true,
        seoDescription: true,
        readingTimeMin: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { name: true } },
        category: { select: { nameFa: true, nameEn: true } },
      },
    }),
    db.postCategory.findMany({
      orderBy: { nameFa: "asc" },
      select: { id: true, nameFa: true, nameEn: true },
    }),
  ])
  if (!post) notFound()
  const STATUS_BADGE: Record<string, { labelFa: string; labelEn: string; cls: string }> = {
    DRAFT:     { labelFa: "پیش‌نویس",   labelEn: "Draft",     cls: "abd-badge--warn"    },
    PUBLISHED: { labelFa: "منتشر شده",  labelEn: "Published", cls: "abd-badge--success" },
    SCHEDULED: { labelFa: "زمان‌بندی",  labelEn: "Scheduled", cls: "abd-badge--info"    },
    ARCHIVED:  { labelFa: "بایگانی",    labelEn: "Archived",  cls: "abd-badge--muted"   },
  }
  const badge = STATUS_BADGE[post.status] ?? { labelFa: post.status, labelEn: post.status, cls: "abd-badge--muted" }
  return (
    <>
      <div className="abd-root">
        {/* Header */}
        <div className="abd-header">
          <Link href={`/${locale}/admin/blog`} className="abd-back">
            <ChevronRight
              style={{
                width: "1rem",
                height: "1rem",
                transform: fa ? "rotate(0deg)" : "rotate(180deg)",
              }}
              aria-hidden="true"
            />
            {fa ? "بازگشت به مقالات" : "Back to posts"}
          </Link>
          <div className="abd-header-row">
            <div>
              <h1 className="abd-title">{fa ? post.titleFa : (post.titleEn ?? post.titleFa)}</h1>
              <div className="abd-meta">
                <span className={`abd-badge ${badge.cls}`}>{fa ? badge.labelFa : badge.labelEn}</span>
                <span className="abd-meta-text">
                  {fa ? "نویسنده:" : "Author:"} {post.author.name ?? "—"}
                </span>
                {post.category && (
                  <span className="abd-meta-text">
                    {fa ? "دسته:" : "Category:"}{" "}
                    {fa ? post.category.nameFa : (post.category.nameEn ?? post.category.nameFa)}
                  </span>
                )}
                <span className="abd-meta-text abd-meta-sep">
                  {fa
                    ? `ویرایش ${formatRelativeTime(post.updatedAt, "fa")}`
                    : `Updated ${formatRelativeTime(post.updatedAt, "en")}`}
                </span>
                <span className="abd-meta-text">
                  {fa ? `${post.viewCount.toLocaleString()} بازدید` : `${post.viewCount.toLocaleString()} views`}
                </span>
              </div>
            </div>
            {post.status === "PUBLISHED" && (
              <Link
                href={`/${locale}/blog/${post.slug}`}
                className="abd-preview-link"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                {fa ? "مشاهده مقاله" : "View post"}
              </Link>
            )}
          </div>
        </div>
        {/* Form */}
        <PostForm locale={locale} fa={fa} categories={categories} post={post} />
      </div>
      <style>{`
        .abd-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .abd-header { display: flex; flex-direction: column; gap: 0.5rem; }
        .abd-back {
          display: inline-flex; align-items: center; gap: 0.25rem;
          font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none;
          width: fit-content; transition: color var(--transition-fast);
        }
        .abd-back:hover { color: var(--color-accent); }
        .abd-header-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 0.75rem;
        }
        .abd-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.375rem; }
        .abd-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
        .abd-meta-text { font-size: 0.8125rem; color: var(--color-text-muted); }
        .abd-meta-sep::before { content: "·"; margin-inline-end: 0.5rem; }
        .abd-badge {
          display: inline-block; font-size: 0.6875rem; font-weight: 600;
          padding: 0.2rem 0.5rem; border-radius: 9999px;
        }
        .abd-badge--warn    { color: var(--color-warning); background-color: var(--color-warning-subtle); }
        .abd-badge--success { color: var(--color-success); background-color: var(--color-success-subtle); }
        .abd-badge--info    { color: var(--color-info);    background-color: var(--color-info-subtle); }
        .abd-badge--muted   { color: var(--color-text-muted); background-color: var(--color-border); }
        .abd-preview-link {
          display: inline-flex; align-items: center; gap: 0.375rem;
          font-size: 0.8125rem; color: var(--color-accent); text-decoration: none;
          border: 1px solid var(--color-border); border-radius: var(--radius-md);
          padding: 0.375rem 0.75rem; white-space: nowrap;
          transition: border-color var(--transition-fast);
        }
        .abd-preview-link:hover { border-color: var(--color-accent); }
      `}</style>
    </>
  )
}
