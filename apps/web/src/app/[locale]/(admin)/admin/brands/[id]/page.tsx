import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import BrandForm from "../brand-form"

export const metadata: Metadata = { title: "ویرایش برند | پنل مدیریت تیراژه" }

type Props = { params: Promise<{ id: string }> }

export default async function AdminBrandEditPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const brand = await db.brand.findUnique({
    where: { id },
    select: { id: true, nameFa: true, nameEn: true, slug: true, description: true, sortOrder: true, isActive: true },
  })

  if (!brand) notFound()

  return (
    <>
      <div className="abe-root">
        <Link href={`/${locale}/admin/brands`} className="abe-back">
          <ChevronLeft size={16} />
          {fa ? "بازگشت به برندها" : "Back to Brands"}
        </Link>
        <h1 className="abe-title">
          {fa ? "ویرایش برند" : "Edit Brand"}
          <span className="abe-slug">{brand.slug}</span>
        </h1>
        <div className="abe-card">
          <BrandForm locale={locale} fa={fa} brand={brand} />
        </div>
      </div>
      <style>{`
        .abe-root { display: flex; flex-direction: column; gap: 1.25rem; max-width: 720px; }
        .abe-back { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none; width: fit-content; }
        .abe-back:hover { color: var(--color-text); }
        .abe-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); display: flex; align-items: baseline; gap: 0.625rem; flex-wrap: wrap; }
        .abe-slug { font-size: 0.8125rem; font-weight: 400; color: var(--color-text-muted); font-family: monospace; direction: ltr; }
        .abe-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.75rem; }
      `}</style>
    </>
  )
}
