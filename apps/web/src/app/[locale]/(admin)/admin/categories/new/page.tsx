import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import CategoryForm from "../category-form"

export const metadata: Metadata = { title: "دسته‌بندی جدید | پنل مدیریت تیراژه" }

export default async function AdminCategoryNewPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const parents = await db.category.findMany({
    where: { parentId: null },
    orderBy: { nameFa: "asc" },
    select: { id: true, nameFa: true, nameEn: true },
  })

  return (
    <>
      <div className="acn-root">
        <Link href={`/${locale}/admin/categories`} className="acn-back">
          <ChevronLeft size={16} />
          {fa ? "بازگشت به دسته‌بندی‌ها" : "Back to Categories"}
        </Link>
        <h1 className="acn-title">{fa ? "ایجاد دسته‌بندی جدید" : "New Category"}</h1>
        <div className="acn-card">
          <CategoryForm locale={locale} fa={fa} parents={parents} />
        </div>
      </div>
      <style>{`
        .acn-root { display: flex; flex-direction: column; gap: 1.25rem; max-width: 720px; }
        .acn-back { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none; width: fit-content; }
        .acn-back:hover { color: var(--color-text); }
        .acn-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
        .acn-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.75rem; }
      `}</style>
    </>
  )
}
