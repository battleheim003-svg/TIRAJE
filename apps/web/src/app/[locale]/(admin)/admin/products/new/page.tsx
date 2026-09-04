import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import ProductForm from "../product-form"

export const metadata: Metadata = { title: "محصول جدید | پنل مدیریت تیراژه" }

export default async function AdminProductNewPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const [brands, factories] = await Promise.all([
    db.brand.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true } }),
    db.factory.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true, city: true, province: true } }),
  ])

  return (
    <>
      <div className="apn-root">
        <Link href={`/${locale}/admin/products`} className="apn-back">
          <ChevronLeft size={16} />
          {fa ? "بازگشت به محصولات" : "Back to Products"}
        </Link>

        <h1 className="apn-title">
          {fa ? "ایجاد محصول جدید" : "New Product"}
        </h1>

        <div className="apn-card">
          <ProductForm locale={locale} fa={fa} brands={brands} factories={factories} />
        </div>
      </div>

      <style>{`
        .apn-root {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-width: 860px;
        }
        .apn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          text-decoration: none;
          width: fit-content;
        }
        .apn-back:hover { color: var(--color-text); }
        .apn-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .apn-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
        }
      `}</style>
    </>
  )
}
