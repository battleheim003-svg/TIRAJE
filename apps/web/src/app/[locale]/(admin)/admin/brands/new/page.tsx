import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import BrandForm from "../brand-form"

export const metadata: Metadata = { title: "برند جدید | پنل مدیریت تیراژه" }

export default async function AdminBrandNewPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  return (
    <>
      <div className="abn-root">
        <Link href={`/${locale}/admin/brands`} className="abn-back">
          <ChevronLeft size={16} />
          {fa ? "بازگشت به برندها" : "Back to Brands"}
        </Link>
        <h1 className="abn-title">{fa ? "ایجاد برند جدید" : "New Brand"}</h1>
        <div className="abn-card">
          <BrandForm locale={locale} fa={fa} />
        </div>
      </div>
      <style>{`
        .abn-root { display: flex; flex-direction: column; gap: 1.25rem; max-width: 720px; }
        .abn-back { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); text-decoration: none; width: fit-content; }
        .abn-back:hover { color: var(--color-text); }
        .abn-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
        .abn-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.75rem; }
      `}</style>
    </>
  )
}
