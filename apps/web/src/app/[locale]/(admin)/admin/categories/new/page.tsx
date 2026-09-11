import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import CategoryForm from "../category-form"
import styles from "../Categories.module.css"

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
    <div className={styles["web-adm-cat__formRoot"]}>
      <Link href={`/${locale}/admin/categories`} className={styles["web-adm-cat__backLink"]}>
        <ChevronLeft style={{ width: "1rem", height: "1rem" }} />
        {fa ? "بازگشت به دسته‌بندی‌ها" : "Back to Categories"}
      </Link>
      <h1 className={styles["web-adm-cat__title"]}>{fa ? "ایجاد دسته‌بندی جدید" : "New Category"}</h1>
      <div className={styles["web-adm-cat__formCard"]}>
        <CategoryForm locale={locale} fa={fa} parents={parents} />
      </div>
    </div>
  )
}
