import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import { formatRelativeTime } from "@/lib/cement"
import { PostForm } from "../post-form"
import styles from "../BlogForm.module.css"

export const metadata: Metadata = { title: "ویرایش مقاله | پنل مدیریت تیراژه" }

type Props = { params: Promise<{ id: string }> }

const STATUS_BADGE: Record<string, { labelFa: string; labelEn: string; variant: "warning" | "success" | "info" | "neutral" }> = {
  DRAFT:     { labelFa: "پیش‌نویس",   labelEn: "Draft",     variant: "warning" },
  PUBLISHED: { labelFa: "منتشر شده",  labelEn: "Published", variant: "success" },
  SCHEDULED: { labelFa: "زمان‌بندی",  labelEn: "Scheduled", variant: "info"    },
  ARCHIVED:  { labelFa: "بایگانی",    labelEn: "Archived",  variant: "neutral" },
}

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

  const badge = STATUS_BADGE[post.status] ?? { labelFa: post.status, labelEn: post.status, variant: "secondary" as const }

  return (
    <div className={styles["web-adm-blg-form__root"]}>
      {/* Header */}
      <div className={styles["web-adm-blg-form__header"]}>
        <Link href={`/${locale}/admin/blog`} className={styles["web-adm-blg-form__backLink"]}>
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
        <div className={styles["web-adm-blg-form__headerRow"]}>
          <div>
            <h1 className={styles["web-adm-blg-form__title"]}>{fa ? post.titleFa : (post.titleEn ?? post.titleFa)}</h1>
            <div className={styles["web-adm-blg-form__meta"]}>
              <Badge variant={badge.variant}>
                {fa ? badge.labelFa : badge.labelEn}
              </Badge>
              <span>
                {fa ? "نویسنده:" : "Author:"} {post.author.name ?? "—"}
              </span>
              {post.category && (
                <span>
                  {fa ? "دسته:" : "Category:"}{" "}
                  {fa ? post.category.nameFa : (post.category.nameEn ?? post.category.nameFa)}
                </span>
              )}
              <span>
                {fa
                  ? `ویرایش ${formatRelativeTime(post.updatedAt, "fa")}`
                  : `Updated ${formatRelativeTime(post.updatedAt, "en")}`}
              </span>
              <span>
                {fa ? `${post.viewCount.toLocaleString()} بازدید` : `${post.viewCount.toLocaleString()} views`}
              </span>
            </div>
          </div>
          {post.status === "PUBLISHED" && (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              className={styles["web-adm-blg-form__viewSiteBtn"]}
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
  )
}
