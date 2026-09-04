import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import CategoryForm from "../category-form"

export const metadata: Metadata = { title: "ویرایش دسته‌بندی | پنل مدیریت تیراژه" }

type Props = { params: Promise<{ id: string }> }

export default async function AdminCategoryEditPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const [category, parents] = await Promise.all([
    db.category.findUnique({
      where: { id },
      select: { id: true, nameFa: true, nameEn: true, slug: true, parentId: true, sortOrder: true, isActive: true },
    }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { nameFa: "asc" },
      select: { id: true, nameFa: true, nameEn: true },
    }),
  ])

  if (!category) notFound()

  return (
    <>
      <div className="ace-root">
        <Link href={`/${locale}/admin/categories`} className="ace-back">
          <ChevronLeft size={16} />
          {fa ? "بازگشت به دسته‌بندی‌ها" : "Back to Categories"}
        </Link>
        <h1 className="ace-title">
          {fa ? "ویرایش دسته‌بندی" : "Edit Category"}
          <span className="ace-slug">{category.slug}</span>
        </h1>
        <div className="ace-card">
          <CategoryForm locale={locale} fa={fa} parents={parents} category={category} />
        </div>
      </div>
      <style>{`
        .ace-root { display: flex; flex-direction: column; gap: 1.25rem; max-width: 720px; }
        .ace-back { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none; width: fit-content; }
        .ace-back:hover { color: var(--color-text); }
        .ace-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); display: flex; align-items: baseline; gap: 0.625rem; flex-wrap: wrap; }
        .ace-slug { font-size: 0.8125rem; font-weight: 400; color: var(--color-text-muted); font-family: monospace; direction: ltr; }
        .ace-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.75rem; }
      `}</style>
    </>
  )
}
