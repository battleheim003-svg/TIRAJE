import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Building2 } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import BrandActions from "./brand-actions"
import styles from "./Brands.module.css"

export const metadata: Metadata = { title: "برندها | پنل مدیریت تیراژه" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminBrandsPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams

  const isArchived = (Array.isArray(sp.archived) ? sp.archived[0] : sp.archived) === "true"

  const where = isArchived ? { archivedAt: { not: null } } : { archivedAt: null }

  const brands = await db.brand.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { nameFa: "asc" }],
    include: { _count: { select: { products: true } } },
  })

  type BrandRow = (typeof brands)[number]
  const totalActive = brands.filter((b: BrandRow) => b.isActive).length

  return (
    <div className={styles["web-adm-brand__wrapper"]}>
      <div className={styles["web-adm-brand__header"]}>
        <div>
          <h1 className={styles["web-adm-brand__title"]}>
            {fa ? (isArchived ? "برندهای آرشیو شده" : "برندها") : (isArchived ? "Archived Brands" : "Brands")}
          </h1>
          <p className={styles["web-adm-brand__count"]}>
            {fa
              ? `${brands.length} برند — ${totalActive} فعال`
              : `${brands.length} total — ${totalActive} active`}
          </p>
        </div>
        {!isArchived && (
          <Link href={`/${locale}/admin/brands/new`} className={styles["web-adm-brand__addBtn"]}>
            <Plus style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            {fa ? "برند جدید" : "New Brand"}
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <Link
          href={`/${locale}/admin/brands`}
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
          {fa ? "برندهای فعال" : "Active Brands"}
        </Link>
        <Link
          href={`/${locale}/admin/brands?archived=true`}
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

      {brands.length === 0 ? (
        <div className={styles["web-adm-brand__empty"]}>
          <Building2 style={{ width: "2.5rem", height: "2.5rem" }} strokeWidth={1.5} aria-hidden="true" />
          <p>{fa ? "هیچ برندی ثبت نشده است." : "No brands found."}</p>
        </div>
      ) : (
        <div className={styles["web-adm-brand__tableWrap"]}>
          <table className={styles["web-adm-brand__table"]}>
            <thead>
              <tr>
                <th className={styles["web-adm-brand__th"]}>{fa ? "نام" : "Name"}</th>
                <th className={styles["web-adm-brand__th"]}>{fa ? "اسلاگ" : "Slug"}</th>
                <th className={styles["web-adm-brand__th"]}>{fa ? "توضیحات" : "Description"}</th>
                <th className={`${styles["web-adm-brand__th"]} ${styles["web-adm-brand__thCenter"]}`}>{fa ? "محصولات" : "Products"}</th>
                <th className={`${styles["web-adm-brand__th"]} ${styles["web-adm-brand__thCenter"]}`}>{fa ? "ترتیب" : "Order"}</th>
                <th className={`${styles["web-adm-brand__th"]} ${styles["web-adm-brand__thCenter"]}`}>{fa ? "وضعیت" : "Status"}</th>
                <th className={styles["web-adm-brand__th"]}></th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand: BrandRow) => (
                <tr key={brand.id} className={styles["web-adm-brand__row"]}>
                  <td className={styles["web-adm-brand__td"]}>
                    <Link href={`/${locale}/admin/brands/${brand.id}`} className={styles["web-adm-brand__link"]}>
                      {fa ? brand.nameFa : (brand.nameEn ?? brand.nameFa)}
                    </Link>
                  </td>
                  <td className={styles["web-adm-brand__td"]}>
                    <code className={styles["web-adm-brand__slug"]}>{brand.slug}</code>
                  </td>
                  <td className={styles["web-adm-brand__td"]}>
                    <span className={styles["web-adm-brand__desc"]}>{brand.description ?? "—"}</span>
                  </td>
                  <td className={`${styles["web-adm-brand__td"]} ${styles["web-adm-brand__tdCenter"]} ${styles["web-adm-brand__num"]}`}>
                    {brand._count.products}
                  </td>
                  <td className={`${styles["web-adm-brand__td"]} ${styles["web-adm-brand__tdCenter"]} ${styles["web-adm-brand__num"]}`}>
                    {brand.sortOrder}
                  </td>
                  <td className={`${styles["web-adm-brand__td"]} ${styles["web-adm-brand__tdCenter"]}`}>
                    <Badge variant={brand.isActive ? "success" : "neutral"}>
                      {brand.isActive ? (fa ? "فعال" : "Active") : (fa ? "غیرفعال" : "Inactive")}
                    </Badge>
                  </td>
                  <td className={styles["web-adm-brand__td"]}>
                    <div className={styles["web-adm-brand__actions"]}>
                      {!isArchived && (
                        <Link href={`/${locale}/admin/brands/${brand.id}`} className={styles["web-adm-brand__editBtn"]}>
                          {fa ? "ویرایش" : "Edit"}
                        </Link>
                      )}
                      <BrandActions brandId={brand.id} fa={fa} productCount={brand._count.products} isArchived={isArchived} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
