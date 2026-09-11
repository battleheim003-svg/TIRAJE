import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import BrandForm from "../brand-form"
import styles from "../Brands.module.css"

export const metadata: Metadata = { title: "برند جدید | پنل مدیریت تیراژه" }

export default async function AdminBrandNewPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

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
      <h1 className={styles["web-adm-brand__title"]}>{fa ? "ایجاد برند جدید" : "New Brand"}</h1>
      <div className={styles["web-adm-brand__formCard"]}>
        <BrandForm locale={locale} fa={fa} />
      </div>
    </div>
  )
}
