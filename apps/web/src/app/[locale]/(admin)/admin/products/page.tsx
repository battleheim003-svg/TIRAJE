import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { ProductsTableClient, ProductRow } from "@/components/admin/ProductsTableClient"
import styles from "./Products.module.css"

export const metadata: Metadata = { title: "محصولات | پنل مدیریت تیراژه" }

const PAGE_SIZE = 20

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminProductsPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const sp = await searchParams

  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? ""
  const isArchived = (Array.isArray(sp.archived) ? sp.archived[0] : sp.archived) === "true"
  const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1", 10))

  const where: Record<string, unknown> = {}
  if (isArchived) {
    where.archivedAt = { not: null }
  } else {
    where.archivedAt = null
  }

  if (q) {
    where.OR = [
      { nameFa: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
    ]
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { brand: { select: { nameFa: true, nameEn: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(p: number, search?: string) {
    const params = new URLSearchParams()
    if (isArchived) params.set("archived", "true")
    const s = search ?? q
    if (s) params.set("q", s)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/${locale}/admin/products${qs ? `?${qs}` : ""}`
  }

  const mappedProducts: ProductRow[] = products.map((p) => ({
    id: p.id,
    nameFa: p.nameFa,
    nameEn: p.nameEn,
    slug: p.slug,
    brand: p.brand,
    cementType: p.cementType,
    packagingType: p.packagingType,
    price: Number(p.price),
    stockStatus: p.stockStatus,
    isActive: p.isActive,
    archivedAt: p.archivedAt,
  }))

  return (
    <div className={styles["web-adm-prod__wrapper"]}>
      <div className={styles["web-adm-prod__header"]}>
        <div>
          <h1 className={styles["web-adm-prod__title"]}>
            {fa ? (isArchived ? "محصولات آرشیو شده" : "محصولات") : (isArchived ? "Archived Products" : "Products")}
          </h1>
          <p className={styles["web-adm-prod__count"]}>
            {fa
              ? `${total.toLocaleString("fa-IR")} محصول`
              : `${total.toLocaleString()} products`}
          </p>
        </div>
        {!isArchived && (
          <Link
            href={`/${locale}/admin/products/new`}
            className={styles["web-adm-prod__addBtn"]}
          >
            <Plus style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            {fa ? "افزودن محصول" : "Add Product"}
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <Link
          href={`/${locale}/admin/products${q ? `?q=${q}` : ""}`}
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
          {fa ? "محصولات فعال" : "Active Products"}
        </Link>
        <Link
          href={`/${locale}/admin/products?archived=true${q ? `&q=${q}` : ""}`}
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

      {/* Search */}
      <form method="GET" action={`/${locale}/admin/products`} className={styles["web-adm-prod__searchWrap"]}>
        {isArchived && <input type="hidden" name="archived" value="true" />}
        <Search
          style={{
            width: "0.9rem",
            height: "0.9rem",
          }}
          className={styles["web-adm-prod__searchIcon"]}
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={fa ? "جستجوی محصول..." : "Search products..."}
          className={styles["web-adm-prod__searchInput"]}
          aria-label={fa ? "جستجو" : "Search"}
        />
      </form>

      {/* DataTable */}
      <ProductsTableClient
        products={mappedProducts}
        locale={locale}
        fa={fa}
        isArchived={isArchived}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles["web-adm-prod__pagination"]}>
          {page > 1 && (
            <Link href={buildUrl(page - 1)} className={styles["web-adm-prod__pageBtn"]}>
              {fa ? "قبلی" : "Prev"}
            </Link>
          )}
          <span className={styles["web-adm-prod__pageInfo"]}>
            {fa
              ? `صفحه ${page.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}`
              : `Page ${page} of ${totalPages}`}
          </span>
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} className={styles["web-adm-prod__pageBtn"]}>
              {fa ? "بعدی" : "Next"}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
