import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Building2 } from "lucide-react"
import { Badge } from "@tirajeh/ui"
import BrandActions from "./brand-actions"
import styles from "./Brands.module.css"

export const metadata: Metadata = { title: "برندها | پنل مدیریت تیراژه" }

export default async function AdminBrandsPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const brands = await db.brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameFa: "asc" }],
    include: { _count: { select: { products: true } } },
  })

  type BrandRow = (typeof brands)[number]
  const totalActive = brands.filter((b: BrandRow) => b.isActive).length

  return (
    <div className={styles["web-adm-brand__wrapper"]}>
      <div className={styles["web-adm-brand__header"]}>
        <div>
          <h1 className={styles["web-adm-brand__title"]}>{fa ? "برندها" : "Brands"}</h1>
          <p className={styles["web-adm-brand__count"]}>
            {fa
              ? `${brands.length} برند — ${totalActive} فعال`
              : `${brands.length} total — ${totalActive} active`}
          </p>
        </div>
        <Link href={`/${locale}/admin/brands/new`} className={styles["web-adm-brand__addBtn"]}>
          <Plus style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
          {fa ? "برند جدید" : "New Brand"}
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
                      <Link href={`/${locale}/admin/brands/${brand.id}`} className={styles["web-adm-brand__editBtn"]}>
                        {fa ? "ویرایش" : "Edit"}
                      </Link>
                      <BrandActions brandId={brand.id} fa={fa} productCount={brand._count.products} />
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
