import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
  STOCK_VARIANT,
  formatPrice,
} from "@/lib/cement"
export const metadata: Metadata = { title: "محصولات | پنل مدیریت تیراژه" }
const PAGE_SIZE = 20
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
export default async function AdminProductsPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? ""
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))
  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { nameFa: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
    ]
  }
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { brand: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  function buildUrl(p: number, search?: string) {
    const params = new URLSearchParams()
    const s = search ?? q
    if (s) params.set("q", s)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/${locale}/admin/products${qs ? `?${qs}` : ""}`
  }
  return (
    <>
      <div className="ap-header">
        <div>
          <h1 className="ap-title">{fa ? "محصولات" : "Products"}</h1>
          <p className="ap-count">
            {fa
              ? `${total.toLocaleString("fa-IR")} محصول`
              : `${total.toLocaleString()} products`}
          </p>
        </div>
        <Link href={`/${locale}/admin/products/new`} className="ap-add-btn">
          <Plus style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
          {fa ? "محصول جدید" : "New Product"}
        </Link>
      </div>
      {/* Search */}
      <form method="GET" action={`/${locale}/admin/products`} className="ap-search-wrap">
        <Search
          style={{
            position: "absolute",
            insetInlineStart: "0.75rem",
            width: "0.9rem",
            height: "0.9rem",
            color: "var(--color-text-muted)",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={fa ? "جستجوی محصول..." : "Search products..."}
          className="ap-search"
          aria-label={fa ? "جستجو" : "Search"}
        />
      </form>
      {/* Table */}
      <div className="ap-table-wrap">
        <table className="ap-table" role="table">
          <thead>
            <tr>
              <th scope="col">{fa ? "نام محصول" : "Product"}</th>
              <th scope="col">{fa ? "برند" : "Brand"}</th>
              <th scope="col">{fa ? "نوع سیمان" : "Cement Type"}</th>
              <th scope="col">{fa ? "بسته‌بندی" : "Packaging"}</th>
              <th scope="col">{fa ? "قیمت" : "Price"}</th>
              <th scope="col">{fa ? "موجودی" : "Stock"}</th>
              <th scope="col">{fa ? "وضعیت" : "Active"}</th>
              <th scope="col"><span className="ap-sr-only">{fa ? "عملیات" : "Actions"}</span></th>
            </tr>
          </thead>
          <tbody>
            {(products as any[]).map((product) => {
              const name = fa ? product.nameFa : (product.nameEn ?? product.nameFa)
              const brandName = fa
                ? product.brand.nameFa
                : (product.brand.nameEn ?? product.brand.nameFa)
              const cementLabel = product.cementType
                ? (CEMENT_TYPE_LABEL[product.cementType as string] ?? null)
                : null
              const packLabel = PACKAGING_LABEL[product.packagingType as string] ?? null
              const stockKey = product.stockStatus as string
              const stockLabel = STOCK_LABEL[stockKey] ?? STOCK_LABEL.OUT_OF_STOCK!
              const stockVariant = STOCK_VARIANT[stockKey] ?? "out"
              return (
                <tr key={product.id}>
                  <td>
                    <Link
                      href={`/${locale}/admin/products/${product.id}`}
                      className="ap-table__name"
                    >
                      {name}
                    </Link>
                  </td>
                  <td className="ap-table__secondary">{brandName}</td>
                  <td className="ap-table__secondary">
                    {cementLabel ? (fa ? cementLabel.fa : cementLabel.en) : "—"}
                  </td>
                  <td className="ap-table__secondary">
                    {packLabel ? (fa ? packLabel.fa : packLabel.en) : "—"}
                  </td>
                  <td className="ap-table__price">
                    {formatPrice(product.price, locale)}
                  </td>
                  <td>
                    <span className={`ap-status-badge ap-status-badge--${stockVariant === "in" ? "success" : stockVariant === "low" ? "warning" : "danger"}`}>
                      {fa ? stockLabel.fa : stockLabel.en}
                    </span>
                  </td>
                  <td>
                    <span className={`ap-status-badge ${product.isActive ? "ap-status-badge--success" : "ap-status-badge--danger"}`}>
                      {product.isActive
                        ? (fa ? "فعال" : "Active")
                        : (fa ? "غیرفعال" : "Inactive")}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/${locale}/admin/products/${product.id}`}
                      className="ap-table__action"
                    >
                      {fa ? "ویرایش" : "Edit"}
                    </Link>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="ap-table__empty">
                  {fa ? "محصولی یافت نشد" : "No products found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="ap-pagination">
          {page > 1 && (
            <Link href={buildUrl(page - 1)} className="ap-page-btn">
              {fa ? "قبلی" : "Prev"}
            </Link>
          )}
          <span className="ap-page-info">
            {fa
              ? `صفحه ${page.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}`
              : `Page ${page} of ${totalPages}`}
          </span>
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} className="ap-page-btn">
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}
      <style>{`
        .ap-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .ap-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .ap-count {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-top: 0.2rem;
          font-variant-numeric: tabular-nums;
        }
        .ap-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 700;
          border-radius: var(--radius-lg);
          text-decoration: none;
          transition: background-color var(--transition-fast);
          white-space: nowrap;
        }
        .ap-add-btn:hover { background-color: var(--color-accent-hover); }
        .ap-add-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
        /* search */
        .ap-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem;
          max-width: 28rem;
        }
        .ap-search {
          width: 100%;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 0.5625rem 0.875rem;
          padding-inline-start: 2.25rem;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color var(--transition-fast);
        }
        .ap-search::placeholder { color: var(--color-text-muted); }
        .ap-search:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-subtle); }
        /* table */
        .ap-table-wrap {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow-x: auto;
          margin-bottom: 1.25rem;
        }
        .ap-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .ap-table thead th {
          padding: 0.75rem 1rem;
          text-align: start;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .ap-table tbody td {
          padding: 0.75rem 1rem;
          color: var(--color-text);
          border-top: 1px solid var(--color-border-subtle);
          white-space: nowrap;
        }
        .ap-table tbody tr:first-child td { border-top: none; }
        .ap-table tbody tr:hover td { background-color: var(--color-background); }
        .ap-table__name {
          color: var(--color-text);
          font-weight: 600;
          text-decoration: none;
          max-width: 16rem;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ap-table__name:hover { color: var(--color-accent); }
        .ap-table__secondary { color: var(--color-text-secondary); }
        .ap-table__price {
          color: var(--color-text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .ap-table__action {
          color: var(--color-accent);
          font-weight: 600;
          font-size: 0.8125rem;
          text-decoration: none;
        }
        .ap-table__action:hover { text-decoration: underline; }
        .ap-table__empty {
          text-align: center;
          color: var(--color-text-muted);
          padding: 3rem !important;
        }
        /* status badge */
        .ap-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.175rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .ap-status-badge--success { background-color: var(--color-success-subtle); color: var(--color-success); }
        .ap-status-badge--warning { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .ap-status-badge--danger  { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .ap-status-badge--info    { background-color: var(--color-accent-subtle);  color: var(--color-accent);  }
        /* pagination */
        .ap-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .ap-page-btn {
          padding: 0.5rem 1rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
        }
        .ap-page-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .ap-page-info {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          font-variant-numeric: tabular-nums;
        }
        .ap-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  )
}
