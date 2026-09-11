import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import CategoryForm from "../category-form"
import styles from "../Categories.module.css"

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
    <div className={styles["web-adm-cat__formRoot"]}>
      <Link href={`/${locale}/admin/categories`} className={styles["web-adm-cat__backLink"]}>
        <ChevronLeft style={{ width: "1rem", height: "1rem" }} />
        {fa ? "بازگشت به دسته‌بندی‌ها" : "Back to Categories"}
      </Link>
      <h1 className={styles["web-adm-cat__title"]}>
        {fa ? "ویرایش دسته‌بندی" : "Edit Category"}
        {" "}
        <span className={styles["web-adm-cat__slug"]}>{category.slug}</span>
      </h1>
      <div className={styles["web-adm-cat__formCard"]}>
        <CategoryForm locale={locale} fa={fa} parents={parents} category={category} />
      </div>
    </div>
  )
}
