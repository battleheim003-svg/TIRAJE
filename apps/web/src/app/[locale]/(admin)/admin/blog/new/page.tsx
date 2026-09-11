import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { PostForm } from "../post-form"
import styles from "../BlogForm.module.css"

export const metadata: Metadata = { title: "مقاله جدید | پنل مدیریت تیراژه" }

export default async function AdminBlogNewPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const categories = await db.postCategory.findMany({
    orderBy: { nameFa: "asc" },
    select: { id: true, nameFa: true, nameEn: true },
  })

  return (
    <div className={styles["web-adm-blg-form__root"]}>
      <div className={styles["web-adm-blg-form__header"]}>
        <Link href={`/${locale}/admin/blog`} className={styles["web-adm-blg-form__backLink"]}>
          <ChevronRight
            style={{
              width: "1rem",
              height: "1rem",
              transform: fa ? "rotate(0deg)" : "rotate(180deg)",
            }}
            aria-hidden="true"
          />
          {fa ? "بازگشت به مقالات" : "Back to posts"}
        </Link>
        <h1 className={styles["web-adm-blg-form__title"]}>{fa ? "مقاله جدید" : "New post"}</h1>
      </div>

      <PostForm locale={locale} fa={fa} categories={categories} />
    </div>
  )
}
