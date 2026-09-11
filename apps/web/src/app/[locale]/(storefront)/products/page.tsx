import Link from "next/link"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from "lucide-react"
import { ProductCard } from "./product-card"
import { FiltersSidebar } from "./filters-sidebar"
import styles from "./ProductsPage.module.css"

export const metadata: Metadata = {
  title: "محصولات | تیراژه",
  description:
    "جستجو و خرید سیمان، مصالح ساختمانی و مواد اولیه از بهترین کارخانه‌ها",
}

// ─── constants ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 12

const SORT_OPTIONS = [
  { value: "newest",       fa: "جدیدترین",        en: "Newest"              },
  { value: "price-asc",    fa: "ارزان‌ترین",       en: "Lowest Price"        },
  { value: "price-desc",   fa: "گران‌ترین",        en: "Highest Price"       },
  { value: "price-update", fa: "آخرین قیمت",       en: "Latest Price Update" },
  { value: "featured",     fa: "ویژه",             en: "Featured"            },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]["value"]

// ─── page ──────────────────────────────────────────────────────────────────
type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductsPage({ searchParams }: Props) {
  const locale = await getLocale()
  const fa = locale === "fa"
  const Arrow = fa ? ArrowLeft : ArrowRight
  const PrevIcon = fa ? ChevronRight : ChevronLeft
  const NextIcon = fa ? ChevronLeft : ChevronRight
  const sp = await searchParams

  // ── parse search params ───────────────────────────────────────────────
  function sp1(key: string): string {
    const v = sp[key]
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "")
  }

  function spMany(key: string): string[] {
    const v = sp[key]
    if (!v) return []
    return Array.isArray(v) ? v : [v]
  }

  const q = sp1("q").trim()
  const categorySlugs = spMany("category").filter(Boolean)
  const brandSlugs = spMany("brand").filter(Boolean)
  const factoryIds = spMany("factory").filter(Boolean)
  const packagingTypes = spMany("packaging").filter(Boolean)
  const cementTypes = spMany("cementType").filter(Boolean)
  const stockFilter = sp1("stock") || "all"
  const minPriceStr = sp1("minPrice")
  const maxPriceStr = sp1("maxPrice")
  const sortParam = (sp1("sort") || "newest") as SortValue
  const page = Math.max(1, parseInt(sp1("page") || "1", 10))

  const minPrice = minPriceStr ? Number(minPriceStr) : undefined
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : undefined

  // ── build where clause ───────────────────────────────────────────────
  const where: Record<string, unknown> = { isActive: true }

  if (q) {
    where.OR = [
      { nameFa: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
    ]
  }

  if (categorySlugs.length) {
    where.productCategories = {
      some: { category: { slug: { in: categorySlugs } } },
    }
  }

  if (brandSlugs.length) {
    where.brand = { slug: { in: brandSlugs } }
  }

  if (factoryIds.length) {
    where.factoryId = { in: factoryIds }
  }

  if (packagingTypes.length) {
    where.packagingType = { in: packagingTypes }
  }

  if (cementTypes.length) {
    where.cementType = { in: cementTypes }
  }

  if (stockFilter === "in_stock") {
    where.stockStatus = "IN_STOCK"
  } else if (stockFilter === "available") {
    where.stockStatus = { in: ["IN_STOCK", "LOW_STOCK"] }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    }
  }

  // ── sort ─────────────────────────────────────────────────────────────
  const orderBy: unknown[] =
    sortParam === "price-asc"
      ? [{ price: "asc" }]
      : sortParam === "price-desc"
        ? [{ price: "desc" }]
        : sortParam === "price-update"
          ? [{ lastPriceUpdate: "desc" }]
          : sortParam === "featured"
            ? [{ isFeatured: "desc" }, { createdAt: "desc" }]
            : [{ createdAt: "desc" }]

  // ── data fetch ───────────────────────────────────────────────────────
  const [products, totalCount, allCategories, allBrands, allFactories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        brand: true,
        factory: true,
      },
      orderBy: orderBy as any,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
    }),
    db.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.factory.findMany({
      where: { isActive: true },
      orderBy: { nameFa: "asc" },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // ── URL builder (preserves all current filters) ───────────────────────
  function buildUrl(overrides: Record<string, string | string[] | undefined>): string {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    for (const c of categorySlugs) params.append("category", c)
    for (const b of brandSlugs) params.append("brand", b)
    for (const f of factoryIds) params.append("factory", f)
    for (const p of packagingTypes) params.append("packaging", p)
    for (const ct of cementTypes) params.append("cementType", ct)
    if (stockFilter !== "all") params.set("stock", stockFilter)
    if (minPriceStr) params.set("minPrice", minPriceStr)
    if (maxPriceStr) params.set("maxPrice", maxPriceStr)
    if (sortParam !== "newest") params.set("sort", sortParam)
    params.set("page", String(page))

    for (const [key, value] of Object.entries(overrides)) {
      params.delete(key)
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v)
      } else if (value !== undefined && value !== "") {
        params.set(key, value)
      }
    }

    const qs = params.toString()
    return `/${locale}/products${qs ? `?${qs}` : ""}`
  }

  const basePath = `/${locale}/products`

  return (
    <div className={styles["web-plist"]}>
      {/* ── Page header ── */}
      <div className={styles["web-plist__header"]}>
        <div className={styles["web-plist__header-inner"]}>
          <h1 className={styles["web-plist__title"]}>{fa ? "محصولات" : "Products"}</h1>
          {q && (
            <p className={styles["web-plist__query-label"]}>
              {fa ? `نتایج جستجو برای «${q}»` : `Results for "${q}"`}
            </p>
          )}
        </div>
      </div>

      {/* ── Layout: sidebar + main ── */}
      <div className={styles["web-plist__layout"]}>
        {/* Filters sidebar */}
        <FiltersSidebar
          locale={locale}
          categories={allCategories as any[]}
          brands={allBrands as any[]}
          factories={allFactories as any[]}
          current={{
            q,
            categories: categorySlugs,
            brands: brandSlugs,
            factories: factoryIds,
            packagingTypes,
            cementTypes,
            stock: stockFilter,
            minPrice: minPriceStr,
            maxPrice: maxPriceStr,
          }}
          basePath={basePath}
        />

        {/* Main content */}
        <main
          className={styles["web-plist__main"]}
          id="main-results"
          aria-label={fa ? "نتایج محصولات" : "Product results"}
        >
          {/* ── Sort bar ── */}
          <div
            className={styles["web-plist__sort-bar"]}
            role="navigation"
            aria-label={fa ? "مرتب‌سازی" : "Sort"}
          >
            <p className={styles["web-plist__sort-count"]} aria-live="polite">
              {fa
                ? `${totalCount.toLocaleString("fa-IR")} محصول`
                : `${totalCount.toLocaleString()} products`}
            </p>
            <div className={styles["web-plist__sort-links"]} role="list">
              {SORT_OPTIONS.map((opt) => {
                const isActive = sortParam === opt.value
                return (
                  <Link
                    key={opt.value}
                    href={buildUrl({ sort: opt.value, page: "1" })}
                    role="listitem"
                    aria-current={isActive ? "page" : undefined}
                    className={`${styles["web-plist__sort-link"]} ${
                      isActive ? styles["web-plist__sort-link--active"] : ""
                    }`}
                  >
                    {fa ? opt.fa : opt.en}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* ── Product grid or empty state ── */}
          {(products as any[]).length === 0 ? (
            <div className={styles["web-plist__empty"]} role="status">
              <PackageSearch
                style={{ width: "3rem", height: "3rem", color: "var(--color-text-muted)" }}
                aria-hidden="true"
              />
              <p className={styles["web-plist__empty-title"]}>
                {fa ? "محصولی یافت نشد" : "No products found"}
              </p>
              <p className={styles["web-plist__empty-sub"]}>
                {fa
                  ? "فیلترها را تغییر دهید یا جستجوی جدیدی انجام دهید"
                  : "Try adjusting your filters or search term"}
              </p>
              <Link href={basePath} className={styles["web-plist__empty-reset"]}>
                {fa ? "پاک کردن فیلترها" : "Clear filters"}
                <Arrow style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div
              className={styles["web-plist__grid"]}
              role="list"
              aria-label={fa ? "لیست محصولات" : "Product list"}
            >
              {(products as any[]).map((product) => (
                <div key={product.id} role="listitem">
                  <ProductCard product={product} locale={locale} />
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <nav
              className={styles["web-plist__pagination"]}
              aria-label={fa ? "صفحه‌بندی" : "Pagination"}
            >
              <Link
                href={buildUrl({ page: String(Math.max(1, page - 1)) })}
                aria-label={fa ? "صفحه قبل" : "Previous page"}
                aria-disabled={page === 1}
                className={`${styles["web-plist__page-btn"]} ${
                  page === 1 ? styles["web-plist__page-btn--disabled"] : ""
                }`}
                tabIndex={page === 1 ? -1 : undefined}
              >
                <PrevIcon style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              </Link>
              <div className={styles["web-plist__page-numbers"]} role="list">
                {buildPageNumbers(page, totalPages).map((item, idx) =>
                  item === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className={styles["web-plist__page-ellipsis"]}
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={buildUrl({ page: String(item) })}
                      role="listitem"
                      aria-label={fa ? `صفحه ${item}` : `Page ${item}`}
                      aria-current={item === page ? "page" : undefined}
                      className={`${styles["web-plist__page-num"]} ${
                        item === page ? styles["web-plist__page-num--active"] : ""
                      }`}
                    >
                      {fa ? Number(item).toLocaleString("fa-IR") : item}
                    </Link>
                  )
                )}
              </div>
              <Link
                href={buildUrl({ page: String(Math.min(totalPages, page + 1)) })}
                aria-label={fa ? "صفحه بعد" : "Next page"}
                aria-disabled={page === totalPages}
                className={`${styles["web-plist__page-btn"]} ${
                  page === totalPages ? styles["web-plist__page-btn--disabled"] : ""
                }`}
                tabIndex={page === totalPages ? -1 : undefined}
              >
                <NextIcon style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              </Link>
            </nav>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── pagination helper ──────────────────────────────────────────────────────
function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = [1]
  if (current > 3) pages.push("…")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("…")
  pages.push(total)
  return pages
}