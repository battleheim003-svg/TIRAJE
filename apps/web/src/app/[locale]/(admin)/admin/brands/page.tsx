import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Building2 } from "lucide-react"
import BrandActions from "./brand-actions"

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
    <>
      <div className="ab-root">
        <div className="ab-header">
          <div>
            <h1 className="ab-title">{fa ? "برندها" : "Brands"}</h1>
            <p className="ab-sub">
              {fa
                ? `${brands.length} برند — ${totalActive} فعال`
                : `${brands.length} total — ${totalActive} active`}
            </p>
          </div>
          <Link href={`/${locale}/admin/brands/new`} className="ab-btn-new">
            <Plus size={16} />
            {fa ? "برند جدید" : "New Brand"}
          </Link>
        </div>

        {brands.length === 0 ? (
          <div className="ab-empty">
            <Building2 size={40} strokeWidth={1.5} />
            <p>{fa ? "هیچ برندی ثبت نشده است." : "No brands found."}</p>
          </div>
        ) : (
          <div className="ab-card">
            <table className="ab-table">
              <thead>
                <tr>
                  <th>{fa ? "نام" : "Name"}</th>
                  <th>{fa ? "اسلاگ" : "Slug"}</th>
                  <th>{fa ? "توضیحات" : "Description"}</th>
                  <th className="ab-th-center">{fa ? "محصولات" : "Products"}</th>
                  <th className="ab-th-center">{fa ? "ترتیب" : "Order"}</th>
                  <th className="ab-th-center">{fa ? "وضعیت" : "Status"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand: BrandRow) => (
                  <tr key={brand.id}>
                    <td className="ab-name">
                      <span className="ab-name__fa">{brand.nameFa}</span>
                      {brand.nameEn && <span className="ab-name__en">{brand.nameEn}</span>}
                    </td>
                    <td><code className="ab-slug">{brand.slug}</code></td>
                    <td className="ab-desc">{brand.description ?? <span className="ab-muted">—</span>}</td>
                    <td className="ab-th-center">{brand._count.products}</td>
                    <td className="ab-th-center">{brand.sortOrder}</td>
                    <td className="ab-th-center">
                      <span className={`ab-badge ab-badge--${brand.isActive ? "active" : "off"}`}>
                        {brand.isActive ? (fa ? "فعال" : "Active") : (fa ? "غیرفعال" : "Inactive")}
                      </span>
                    </td>
                    <td className="ab-actions">
                      <Link href={`/${locale}/admin/brands/${brand.id}`} className="ab-action-link">
                        {fa ? "ویرایش" : "Edit"}
                      </Link>
                      <BrandActions brandId={brand.id} fa={fa} productCount={brand._count.products} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .ab-root { display: flex; flex-direction: column; gap: 1.25rem; }
        .ab-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
        .ab-title { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
        .ab-sub { font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.2rem; }
        .ab-btn-new {
          display: inline-flex; align-items: center; gap: 0.375rem;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.875rem; font-weight: 600; padding: 0.5rem 1rem;
          border-radius: var(--radius-md); text-decoration: none; white-space: nowrap;
          transition: background-color var(--transition-fast);
        }
        .ab-btn-new:hover { background-color: var(--color-accent-hover); }
        .ab-empty {
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
          padding: 3rem; color: var(--color-text-muted);
          background-color: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-lg); text-align: center;
        }
        .ab-card {
          background-color: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-lg); overflow: hidden; overflow-x: auto;
        }
        .ab-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .ab-table th {
          padding: 0.625rem 0.875rem; font-size: 0.6875rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border); text-align: start; white-space: nowrap;
        }
        .ab-th-center { text-align: center !important; }
        .ab-table td {
          padding: 0.625rem 0.875rem; border-bottom: 1px solid var(--color-border);
          vertical-align: middle; color: var(--color-text);
        }
        .ab-table tbody tr:last-child td { border-bottom: none; }
        .ab-name { display: flex; flex-direction: column; gap: 0.125rem; }
        .ab-name__fa { font-weight: 500; }
        .ab-name__en { font-size: 0.75rem; color: var(--color-text-muted); direction: ltr; }
        .ab-slug { font-size: 0.75rem; font-family: monospace; color: var(--color-text-muted); background-color: var(--color-border); padding: 0.125rem 0.375rem; border-radius: var(--radius-sm, 4px); direction: ltr; display: inline-block; }
        .ab-desc { font-size: 0.8125rem; color: var(--color-text-secondary); max-width: 20rem; }
        .ab-muted { color: var(--color-text-muted); }
        .ab-badge { display: inline-block; font-size: 0.6875rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 999px; }
        .ab-badge--active { color: var(--color-success); background-color: var(--color-success-subtle); }
        .ab-badge--off { color: var(--color-text-muted); background-color: var(--color-border); }
        .ab-actions { display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; white-space: nowrap; }
        .ab-action-link { font-size: 0.8125rem; color: var(--color-accent); text-decoration: none; }
        .ab-action-link:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}
