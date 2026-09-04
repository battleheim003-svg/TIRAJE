import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { PostForm } from "../post-form"

export const metadata: Metadata = { title: "مقاله جدید | پنل مدیریت تیراژه" }

export default async function AdminBlogNewPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const categories = await db.postCategory.findMany({
    orderBy: { nameFa: "asc" },
    select: { id: true, nameFa: true, nameEn: true },
  })

  return (
    <>
      <div className="apbn-root">
        <div className="apbn-header">
          <Link href={`/${locale}/admin/blog`} className="apbn-back">
            <ChevronRight size={16} className="apbn-back-icon" aria-hidden="true" />
            {fa ? "بازگشت به مقالات" : "Back to posts"}
          </Link>
          <h1 className="apbn-title">{fa ? "مقاله جدید" : "New post"}</h1>
        </div>

        <PostForm locale={locale} fa={fa} categories={categories} />
      </div>

      <style>{`
        .apbn-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .apbn-header { display: flex; flex-direction: column; gap: 0.375rem; }
        .apbn-back {
          display: inline-flex; align-items: center; gap: 0.25rem;
          font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none;
          width: fit-content; transition: color var(--transition-fast);
        }
        .apbn-back:hover { color: var(--color-accent); }
        .apbn-back-icon { transform: rotate(180deg); }
        [dir="rtl"] .apbn-back-icon { transform: rotate(0deg); }
        .apbn-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
      `}</style>
    </>
  )
}
