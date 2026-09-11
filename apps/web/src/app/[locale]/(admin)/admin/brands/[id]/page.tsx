import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import BrandForm from "../brand-form"
import styles from "../Brands.module.css"

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
    <div className={styles["web-adm-brand__formRoot"]}>
      <Link href={`/${locale}/admin/brands`} className={styles["web-adm-brand__backLink"]}>
        <ChevronRight
          style={{
            width: "1rem",
            height: "1rem",
            transform: fa ? "rotate(0deg)" : "rotate(180deg)",
          }}
          aria-hidden="true"
        />
        {fa ? "بازگشت به برندها" : "Back to Brands"}
      </Link>
      <h1 className={styles["web-adm-brand__title"]}>
        <span>{fa ? "ویرایش برند" : "Edit Brand"}</span>
        <span className={styles["web-adm-brand__slug"]} style={{ marginInlineStart: "var(--space-2)" }}>{brand.slug}</span>
      </h1>
      <div className={styles["web-adm-brand__formCard"]}>
        <BrandForm locale={locale} fa={fa} brand={brand} />
      </div>
    </div>
  )
}
