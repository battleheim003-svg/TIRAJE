import React from "react"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus, ChevronRight, Tag } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import CategoryActions from "./category-actions"
import styles from "./Categories.module.css"

export const metadata: Metadata = { title: "دسته‌بندی‌ها | پنل مدیریت تیراژه" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminCategoriesPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams

  const isArchived = (Array.isArray(sp.archived) ? sp.archived[0] : sp.archived) === "true"

  const where = isArchived ? { archivedAt: { not: null } } : { archivedAt: null }

  const categories = await db.category.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { nameFa: "asc" }],
    include: {
      parent: { select: { nameFa: true, nameEn: true } },
      _count: { select: { children: true, productCategories: true } },
    },
  })

  type CatRow = (typeof categories)[number]

  const roots = categories.filter((c: CatRow) => !c.parentId)
  const childrenMap = new Map<string, CatRow[]>()
  for (const c of categories) {
    if (c.parentId) {
      const arr = childrenMap.get(c.parentId) ?? []
      arr.push(c)
      childrenMap.set(c.parentId, arr)
    }
  }

  const totalActive = categories.filter((c: CatRow) => c.isActive).length

  return (
    <div className={styles["web-adm-cat__wrapper"]}>
      {/* Header */}
      <div className={styles["web-adm-cat__header"]}>
        <div>
          <h1 className={styles["web-adm-cat__title"]}>
            {fa ? (isArchived ? "دسته‌بندی‌های آرشیو شده" : "دسته‌بندی‌ها") : (isArchived ? "Archived Categories" : "Categories")}
          </h1>
          <p className={styles["web-adm-cat__count"]}>
            {fa
              ? `${categories.length} دسته‌بندی — ${totalActive} فعال`
              : `${categories.length} total — ${totalActive} active`}
          </p>
        </div>
        {!isArchived && (
          <Link href={`/${locale}/admin/categories/new`} className={styles["web-adm-cat__addBtn"]}>
            <Plus style={{ width: "1rem", height: "1rem" }} />
            {fa ? "دسته جدید" : "New Category"}
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <Link
          href={`/${locale}/admin/categories`}
          style={{
            padding: "0.4rem 0.85rem",
            borderRadius: "0.375rem",
            fontWeight: !isArchived ? 600 : 400,
            fontSize: "0.85rem",
            textDecoration: "none",
            backgroundColor: !isArchived ? "var(--color-primary-subtle, rgba(0,0,0,0.06))" : "transparent",
            color: !isArchived ? "var(--color-primary, #0284c7)" : "var(--color-text-secondary, #64748b)",
          }}
        >
          {fa ? "دسته‌بندی‌های فعال" : "Active Categories"}
        </Link>
        <Link
          href={`/${locale}/admin/categories?archived=true`}
          style={{
            padding: "0.4rem 0.85rem",
            borderRadius: "0.375rem",
            fontWeight: isArchived ? 600 : 400,
            fontSize: "0.85rem",
            textDecoration: "none",
            backgroundColor: isArchived ? "var(--color-primary-subtle, rgba(0,0,0,0.06))" : "transparent",
            color: isArchived ? "var(--color-primary, #0284c7)" : "var(--color-text-secondary, #64748b)",
          }}
        >
          {fa ? "آرشیو شده" : "Archived"}
        </Link>
      </div>

      {/* Table */}
      {categories.length === 0 ? (
        <div className={styles["web-adm-cat__empty"]}>
          <Tag style={{ width: "2.5rem", height: "2.5rem" }} strokeWidth={1.5} />
          <p>{fa ? "هیچ دسته‌بندی‌ای ثبت نشده است." : "No categories found."}</p>
        </div>
      ) : (
        <div className={styles["web-adm-cat__tableWrap"]}>
          <table className={styles["web-adm-cat__table"]}>
            <thead>
              <tr>
                <th className={styles["web-adm-cat__th"]}>{fa ? "نام" : "Name"}</th>
                <th className={styles["web-adm-cat__th"]}>{fa ? "اسلاگ" : "Slug"}</th>
                <th className={styles["web-adm-cat__th"]}>{fa ? "والد" : "Parent"}</th>
                <th className={`${styles["web-adm-cat__th"]} ${styles["web-adm-cat__thCenter"]}`}>{fa ? "زیردسته" : "Children"}</th>
                <th className={`${styles["web-adm-cat__th"]} ${styles["web-adm-cat__thCenter"]}`}>{fa ? "محصولات" : "Products"}</th>
                <th className={`${styles["web-adm-cat__th"]} ${styles["web-adm-cat__thCenter"]}`}>{fa ? "ترتیب" : "Order"}</th>
                <th className={`${styles["web-adm-cat__th"]} ${styles["web-adm-cat__thCenter"]}`}>{fa ? "وضعیت" : "Status"}</th>
                <th className={styles["web-adm-cat__th"]}></th>
              </tr>
            </thead>
            <tbody>
              {roots.map((cat: CatRow) => (
                <React.Fragment key={cat.id}>
                  <tr className={styles["web-adm-cat__row"]}>
                    <td className={styles["web-adm-cat__td"]}>
                      <span style={{ fontWeight: 600 }}>{fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)}</span>
                      {cat.nameEn && fa && (
                        <span className={styles["web-adm-cat__slug"]} style={{ display: "block" }}>
                          {cat.nameEn}
                        </span>
                      )}
                    </td>
                    <td className={styles["web-adm-cat__td"]}>
                      <code className={styles["web-adm-cat__slug"]}>{cat.slug}</code>
                    </td>
                    <td className={styles["web-adm-cat__td"]} style={{ color: "var(--color-text-muted)" }}>—</td>
                    <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]} ${styles["web-adm-cat__num"]}`}>
                      {cat._count.children}
                    </td>
                    <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]} ${styles["web-adm-cat__num"]}`}>
                      {cat._count.productCategories}
                    </td>
                    <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]} ${styles["web-adm-cat__num"]}`}>
                      {cat.sortOrder}
                    </td>
                    <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]}`}>
                      <Badge variant={cat.isActive ? "success" : "neutral"}>
                        {cat.isActive ? (fa ? "فعال" : "Active") : (fa ? "غیرفعال" : "Inactive")}
                      </Badge>
                    </td>
                    <td className={styles["web-adm-cat__td"]}>
                      <div className={styles["web-adm-cat__actions"]}>
                        {!isArchived && (
                          <Link href={`/${locale}/admin/categories/${cat.id}`} className={styles["web-adm-cat__editBtn"]}>
                            {fa ? "ویرایش" : "Edit"}
                          </Link>
                        )}
                        <CategoryActions
                          categoryId={cat.id}
                          fa={fa}
                          productCount={cat._count.productCategories}
                          childCount={cat._count.children}
                          isArchived={isArchived}
                        />
                      </div>
                    </td>
                  </tr>
                  {(childrenMap.get(cat.id) ?? []).map((child: CatRow) => (
                    <tr key={child.id} className={`${styles["web-adm-cat__row"]} ${styles["web-adm-cat__rowChild"]}`}>
                      <td className={styles["web-adm-cat__td"]} style={{ paddingInlineStart: "var(--space-8)" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                          <ChevronRight style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-text-muted)", flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{fa ? child.nameFa : (child.nameEn ?? child.nameFa)}</span>
                        </div>
                        {child.nameEn && fa && (
                          <span className={styles["web-adm-cat__slug"]} style={{ display: "block", paddingInlineStart: "var(--space-4)" }}>
                            {child.nameEn}
                          </span>
                        )}
                      </td>
                      <td className={styles["web-adm-cat__td"]}>
                        <code className={styles["web-adm-cat__slug"]}>{child.slug}</code>
                      </td>
                      <td className={styles["web-adm-cat__td"]} style={{ color: "var(--color-text-muted)" }}>
                        {fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)}
                      </td>
                      <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]} ${styles["web-adm-cat__num"]}`}>
                        {child._count.children}
                      </td>
                      <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]} ${styles["web-adm-cat__num"]}`}>
                        {child._count.productCategories}
                      </td>
                      <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]} ${styles["web-adm-cat__num"]}`}>
                        {child.sortOrder}
                      </td>
                      <td className={`${styles["web-adm-cat__td"]} ${styles["web-adm-cat__tdCenter"]}`}>
                        <Badge variant={child.isActive ? "success" : "neutral"}>
                          {child.isActive ? (fa ? "فعال" : "Active") : (fa ? "غیرفعال" : "Inactive")}
                        </Badge>
                      </td>
                      <td className={styles["web-adm-cat__td"]}>
                        <div className={styles["web-adm-cat__actions"]}>
                          {!isArchived && (
                            <Link href={`/${locale}/admin/categories/${child.id}`} className={styles["web-adm-cat__editBtn"]}>
                              {fa ? "ویرایش" : "Edit"}
                            </Link>
                          )}
                          <CategoryActions
                            categoryId={child.id}
                            fa={fa}
                            productCount={child._count.productCategories}
                            childCount={child._count.children}
                            isArchived={isArchived}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
