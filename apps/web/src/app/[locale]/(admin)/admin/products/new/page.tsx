import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import ProductForm from "../product-form"
import styles from "../ProductForm.module.css"

export const metadata: Metadata = { title: "محصول جدید | پنل مدیریت تیراژه" }

export default async function AdminProductNewPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const [brands, factories, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true } }),
    db.factory.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true, city: true, province: true } }),
    db.category.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true } }),
  ])

  return (
    <div className={styles["web-adm-prod-form__pageRoot"]}>
      <Link href={`/${locale}/admin/products`} className={styles["web-adm-prod-form__backLink"]}>
        <ChevronRight
          style={{
            width: "1rem",
            height: "1rem",
            transform: fa ? "rotate(0deg)" : "rotate(180deg)",
          }}
          aria-hidden="true"
        />
        {fa ? "بازگشت به محصولات" : "Back to Products"}
      </Link>

      <h1 className={styles["web-adm-prod-form__pageTitle"]}>
        {fa ? "ایجاد محصول جدید" : "New Product"}
      </h1>

      <div className={styles["web-adm-prod-form__pageCard"]}>
        <ProductForm
          locale={locale}
          fa={fa}
          brands={brands}
          factories={factories}
          categories={categories}
        />
      </div>
    </div>
  )
}
