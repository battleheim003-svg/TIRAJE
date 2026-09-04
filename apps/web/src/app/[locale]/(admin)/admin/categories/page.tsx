import React from "react"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Plus, ChevronRight, Tag } from "lucide-react"
import CategoryActions from "./category-actions"

export const metadata: Metadata = { title: "دسته‌بندی‌ها | پنل مدیریت تیراژه" }

export default async function AdminCategoriesPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const categories = await db.category.findMany({
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
    <>
      <div className="ac-root">
        {/* Header */}
        <div className="ac-header">
          <div>
            <h1 className="ac-title">{fa ? "دسته‌بندی‌ها" : "Categories"}</h1>
            <p className="ac-sub">
              {fa
                ? `${categories.length} دسته‌بندی — ${totalActive} فعال`
                : `${categories.length} total — ${totalActive} active`}
            </p>
          </div>
          <Link href={`/${locale}/admin/categories/new`} className="ac-btn-new">
            <Plus size={16} />
            {fa ? "دسته جدید" : "New Category"}
          </Link>
        </div>

        {/* Table */}
        {categories.length === 0 ? (
          <div className="ac-empty">
            <Tag size={40} strokeWidth={1.5} />
            <p>{fa ? "هیچ دسته‌بندی‌ای ثبت نشده است." : "No categories found."}</p>
          </div>
        ) : (
          <div className="ac-card">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>{fa ? "نام" : "Name"}</th>
                  <th>{fa ? "اسلاگ" : "Slug"}</th>
                  <th>{fa ? "والد" : "Parent"}</th>
                  <th className="ac-th-center">{fa ? "زیردسته" : "Children"}</th>
                  <th className="ac-th-center">{fa ? "محصولات" : "Products"}</th>
                  <th className="ac-th-center">{fa ? "ترتیب" : "Order"}</th>
                  <th className="ac-th-center">{fa ? "وضعیت" : "Status"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roots.map((cat: CatRow) => (
                  <React.Fragment key={cat.id}>
                    <tr key={cat.id} className="ac-tr-root">
                      <td className="ac-name">
                        <span className="ac-name__text">{fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)}</span>
                        {cat.nameEn && fa && <span className="ac-name__en">{cat.nameEn}</span>}
                      </td>
                      <td><code className="ac-slug">{cat.slug}</code></td>
                      <td className="ac-muted">—</td>
                      <td className="ac-th-center">{cat._count.children}</td>
                      <td className="ac-th-center">{cat._count.productCategories}</td>
                      <td className="ac-th-center">{cat.sortOrder}</td>
                      <td className="ac-th-center">
                        <span className={`ac-badge ac-badge--${cat.isActive ? "active" : "off"}`}>
                          {cat.isActive ? (fa ? "فعال" : "Active") : (fa ? "غیرفعال" : "Inactive")}
                        </span>
                      </td>
                      <td className="ac-actions">
                        <Link href={`/${locale}/admin/categories/${cat.id}`} className="ac-action-link">
                          {fa ? "ویرایش" : "Edit"}
                        </Link>
                        <CategoryActions categoryId={cat.id} fa={fa} productCount={cat._count.productCategories} childCount={cat._count.children} />
                      </td>
                    </tr>
                    {(childrenMap.get(cat.id) ?? []).map((child: CatRow) => (
                      <tr key={child.id} className="ac-tr-child">
                        <td className="ac-name ac-name--child">
                          <ChevronRight size={13} className="ac-child-arrow" />
                          <span className="ac-name__text">{fa ? child.nameFa : (child.nameEn ?? child.nameFa)}</span>
                          {child.nameEn && fa && <span className="ac-name__en">{child.nameEn}</span>}
                        </td>
                        <td><code className="ac-slug">{child.slug}</code></td>
                        <td className="ac-muted">{fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)}</td>
                        <td className="ac-th-center">{child._count.children}</td>
                        <td className="ac-th-center">{child._count.productCategories}</td>
                        <td className="ac-th-center">{child.sortOrder}</td>
                        <td className="ac-th-center">
                          <span className={`ac-badge ac-badge--${child.isActive ? "active" : "off"}`}>
                            {child.isActive ? (fa ? "فعال" : "Active") : (fa ? "غیرفعال" : "Inactive")}
                          </span>
                        </td>
                        <td className="ac-actions">
                          <Link href={`/${locale}/admin/categories/${child.id}`} className="ac-action-link">
                            {fa ? "ویرایش" : "Edit"}
                          </Link>
                          <CategoryActions categoryId={child.id} fa={fa} productCount={child._count.productCategories} childCount={child._count.children} />
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

      <style>{`
        .ac-root {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .ac-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .ac-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .ac-sub {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-top: 0.2rem;
        }
        .ac-btn-new {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          text-decoration: none;
          white-space: nowrap;
          transition: background-color var(--transition-fast);
        }
        .ac-btn-new:hover { background-color: var(--color-accent-hover); }

        .ac-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 3rem;
          color: var(--color-text-muted);
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          text-align: center;
        }

        .ac-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          overflow-x: auto;
        }
        .ac-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .ac-table th {
          padding: 0.625rem 0.875rem;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          text-align: start;
          white-space: nowrap;
        }
        .ac-th-center { text-align: center !important; }
        .ac-table td {
          padding: 0.625rem 0.875rem;
          border-bottom: 1px solid var(--color-border);
          vertical-align: middle;
          color: var(--color-text);
        }
        .ac-tr-root td { background-color: transparent; }
        .ac-tr-child td { background-color: color-mix(in srgb, var(--color-border) 20%, transparent); }
        .ac-table tbody tr:last-child td { border-bottom: none; }

        .ac-name {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .ac-name--child { padding-inline-start: 1.5rem !important; }
        .ac-child-arrow { color: var(--color-text-muted); flex-shrink: 0; }
        .ac-name__text { font-weight: 500; }
        .ac-name__en {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          direction: ltr;
        }
        .ac-slug {
          font-size: 0.75rem;
          font-family: monospace;
          color: var(--color-text-muted);
          background-color: var(--color-border);
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-sm, 4px);
          direction: ltr;
          display: inline-block;
        }
        .ac-muted { color: var(--color-text-muted); }

        .ac-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
        }
        .ac-badge--active {
          color: var(--color-success);
          background-color: var(--color-success-subtle);
        }
        .ac-badge--off {
          color: var(--color-text-muted);
          background-color: var(--color-border);
        }

        .ac-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: flex-end;
          white-space: nowrap;
        }
        .ac-action-link {
          font-size: 0.8125rem;
          color: var(--color-accent);
          text-decoration: none;
        }
        .ac-action-link:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}
