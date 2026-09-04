import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { ChevronLeft, ChevronRight, MapPin, Clock, Scale } from "lucide-react"
import {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
  STOCK_VARIANT,
  PRICE_UNIT,
  formatPrice,
  formatRelativeTime,
  formatWeight,
} from "@/lib/cement"
import { ImageGallery } from "./image-gallery"
import AddToCartButton from "./add-to-cart"

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await db.product.findUnique({
    where: { slug },
    select: { nameFa: true, nameEn: true, descriptionFa: true, descriptionEn: true },
  })
  if (!product) return {}
  return {
    title: `${product.nameFa} | تیراژه`,
    description:
      (product.descriptionFa?.slice(0, 160)) ??
      (product.descriptionEn?.slice(0, 160)) ??
      undefined,
    alternates: {
      languages: {
        fa: `/fa/products/${slug}`,
        en: `/en/products/${slug}`,
      },
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const fa = locale === "fa"
  const BackIcon = fa ? ChevronRight : ChevronLeft

  const product = await db.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      factory: true,
      productCategories: { include: { category: true }, orderBy: { sortOrder: "asc" } },
    },
  })

  if (!product) notFound()

  // ── display values ─────────────────────────────────────────────────────────
  const name = fa ? product.nameFa : (product.nameEn ?? product.nameFa)
  const description = fa
    ? product.descriptionFa
    : (product.descriptionEn ?? product.descriptionFa)
  const brandName = fa
    ? product.brand.nameFa
    : (product.brand.nameEn ?? product.brand.nameFa)

  const firstCategory = product.productCategories[0]?.category ?? null
  const factoryLocation = product.factory
    ? fa
      ? `${product.factory.city}، ${product.factory.province}`
      : `${product.factory.city}, ${product.factory.province}`
    : null
  const factoryName = product.factory
    ? fa
      ? product.factory.nameFa
      : (product.factory.nameEn ?? product.factory.nameFa)
    : null

  const stockKey = product.stockStatus as string
  const stockLabel = STOCK_LABEL[stockKey] ?? STOCK_LABEL.OUT_OF_STOCK!
  const stockVariant = STOCK_VARIANT[stockKey] ?? "out"
  const isAvailable = stockVariant !== "out"

  const cementLabel = product.cementType
    ? (CEMENT_TYPE_LABEL[product.cementType as string] ?? null)
    : null
  const packLabel = PACKAGING_LABEL[product.packagingType as string] ?? null
  const priceUnit = PRICE_UNIT[product.packagingType as string] ?? null

  const priceNum = Number(product.price)
  const compareNum = Number(product.comparePrice ?? 0)
  const hasDiscount = compareNum > 0 && compareNum > priceNum
  const discountPct = hasDiscount ? Math.round((1 - priceNum / compareNum) * 100) : 0

  const specs = product.technicalSpecs as Record<string, string> | null

  const images = product.images as {
    id: string
    url: string
    altFa?: string | null
    altEn?: string | null
    isPrimary: boolean
  }[]

  return (
    <>
      {/* ── Container ── */}
      <div className="pd-container">

        {/* ── Breadcrumb ── */}
        <nav className="pd-breadcrumb" aria-label={fa ? "مسیر" : "Breadcrumb"}>
          <Link href={`/${locale}`} className="pd-breadcrumb__link">
            {fa ? "خانه" : "Home"}
          </Link>
          <span className="pd-breadcrumb__sep" aria-hidden="true">/</span>
          <Link href={`/${locale}/products`} className="pd-breadcrumb__link">
            {fa ? "محصولات" : "Products"}
          </Link>
          {firstCategory && (
            <>
              <span className="pd-breadcrumb__sep" aria-hidden="true">/</span>
              <Link
                href={`/${locale}/products?category=${firstCategory.slug}`}
                className="pd-breadcrumb__link"
              >
                {fa ? firstCategory.nameFa : (firstCategory.nameEn ?? firstCategory.nameFa)}
              </Link>
            </>
          )}
          <span className="pd-breadcrumb__sep" aria-hidden="true">/</span>
          <span className="pd-breadcrumb__current" aria-current="page">{name}</span>
        </nav>

        {/* ── Back link ── */}
        <Link href={`/${locale}/products`} className="pd-back">
          <BackIcon style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
          {fa ? "بازگشت به محصولات" : "Back to Products"}
        </Link>

        {/* ── Main layout ── */}
        <div className="pd-layout">

          {/* Gallery */}
          <div className="pd-gallery">
            <ImageGallery images={images} productName={name} locale={locale} />
          </div>

          {/* Info panel */}
          <div className="pd-info">

            {/* Brand */}
            <p className="pd-brand">{brandName}</p>

            {/* Name */}
            <h1 className="pd-name">{name}</h1>

            {/* Type + Packaging chips */}
            <div className="pd-chips" aria-label={fa ? "مشخصات" : "Specs"}>
              {cementLabel && (
                <span className="chip chip--type">
                  {fa ? cementLabel.fa : cementLabel.en}
                </span>
              )}
              {packLabel && (
                <span className="chip chip--pack">{packLabel.short}</span>
              )}
              {hasDiscount && (
                <span className="chip chip--discount" aria-label={fa ? "تخفیف" : "Discount"}>
                  {discountPct}%{fa ? " تخفیف" : " off"}
                </span>
              )}
            </div>

            {/* Meta: weight + factory */}
            <div className="pd-meta">
              <span className="pd-meta__item" title={fa ? "وزن واحد" : "Unit weight"}>
                <Scale style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                {formatWeight(product.weightKg, locale)}
              </span>
              {factoryName && factoryLocation && (
                <span className="pd-meta__item">
                  <MapPin style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                  <span>
                    {factoryName}
                    <span className="pd-meta__sub">{factoryLocation}</span>
                  </span>
                </span>
              )}
              <span className="pd-meta__item">
                <Clock style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
                {fa ? "به‌روزرسانی قیمت:" : "Price updated:"}{" "}
                {formatRelativeTime(product.lastPriceUpdate, locale)}
              </span>
            </div>

            {/* Divider */}
            <div className="pd-divider" role="separator" aria-hidden="true" />

            {/* Stock + Price */}
            <div className="pd-price-block">
              <span
                className={`stock-pill stock-pill--${stockVariant}`}
                aria-label={fa ? stockLabel.fa : stockLabel.en}
              >
                <span className="stock-pill__dot" aria-hidden="true" />
                {fa ? stockLabel.fa : stockLabel.en}
              </span>

              <div className="pd-prices">
                {hasDiscount && (
                  <span className="pd-price__compare tabular" aria-label={fa ? "قیمت قبل" : "Was"}>
                    {formatPrice(product.comparePrice, locale)}
                  </span>
                )}
                <span
                  className={`pd-price tabular ${!isAvailable ? "pd-price--unavailable" : ""}`}
                  aria-label={fa ? "قیمت" : "Price"}
                >
                  {formatPrice(product.price, locale)}
                </span>
                {priceUnit && priceNum > 0 && (
                  <span className="pd-price__unit" aria-hidden="true">
                    {fa ? priceUnit.fa : priceUnit.en}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="pd-divider" role="separator" aria-hidden="true" />

            {/* Add to cart */}
            <AddToCartButton
              productId={product.id}
              minOrderQty={product.minOrderQty}
              stockStatus={product.stockStatus as string}
              locale={locale}
            />
          </div>
        </div>

        {/* ── Tabs: Description + Specs ── */}
        {(description || (specs && Object.keys(specs).length > 0)) && (
          <div className="pd-tabs">
            {/* Description */}
            {description && (
              <section className="pd-section" aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="pd-section__title">
                  {fa ? "توضیحات محصول" : "Product Description"}
                </h2>
                <div className="pd-description">
                  {description}
                </div>
              </section>
            )}

            {/* Technical Specs */}
            {specs && Object.keys(specs).length > 0 && (
              <section className="pd-section" aria-labelledby="specs-heading">
                <h2 id="specs-heading" className="pd-section__title">
                  {fa ? "مشخصات فنی" : "Technical Specifications"}
                </h2>
                <div className="pd-specs-wrap">
                  <table className="pd-specs-table" role="table">
                    <tbody>
                      {Object.entries(specs).map(([key, value], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? "pd-specs-row--even" : ""}>
                          <th scope="row" className="pd-specs-key">{key}</th>
                          <td className="pd-specs-val">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        .pd-container {
          max-width: 72rem;
          margin-inline: auto;
          padding-inline: 1.5rem;
          padding-block: 1.5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .pd-container { padding-inline: 2rem; padding-block: 2rem 5rem; }
        }

        /* breadcrumb */
        .pd-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .pd-breadcrumb__link {
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .pd-breadcrumb__link:hover { color: var(--color-accent); }
        .pd-breadcrumb__sep { color: var(--color-border); user-select: none; }
        .pd-breadcrumb__current { color: var(--color-text); font-weight: 600; }

        /* back link */
        .pd-back {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
          align-self: flex-start;
        }
        .pd-back:hover { color: var(--color-accent); }
        .pd-back:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 2px; }

        /* layout */
        .pd-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .pd-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
            align-items: start;
          }
        }
        @media (min-width: 1024px) {
          .pd-layout { grid-template-columns: 5fr 6fr; gap: 3.5rem; }
        }

        .pd-gallery { width: 100%; }

        /* info panel */
        .pd-info {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .pd-brand {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-accent);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          line-height: 1;
        }
        .pd-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text);
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        @media (min-width: 640px) { .pd-name { font-size: 1.75rem; } }

        /* chips */
        .pd-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 0.2rem 0.625rem;
          border-radius: var(--radius-sm);
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .chip--type { background-color: var(--color-accent-subtle); color: var(--color-accent); }
        .chip--pack { background-color: var(--color-border-subtle); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
        .chip--discount { background-color: var(--color-danger-subtle); color: var(--color-danger); }

        /* meta */
        .pd-meta {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .pd-meta__item {
          display: inline-flex;
          align-items: flex-start;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }
        .pd-meta__item svg { flex-shrink: 0; margin-top: 0.1rem; }
        .pd-meta__sub {
          display: block;
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          margin-top: 0.1rem;
        }

        /* divider */
        .pd-divider {
          height: 1px;
          background-color: var(--color-border-subtle);
          margin-block: 0.25rem;
        }

        /* price block */
        .pd-price-block {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .pd-prices {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
        }
        .pd-price__compare {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          text-decoration: line-through;
        }
        .pd-price {
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--color-accent);
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .pd-price--unavailable { color: var(--color-text-muted); font-weight: 600; }
        .pd-price__unit {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--color-text-muted);
          text-align: end;
        }

        /* stock pill */
        .stock-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .stock-pill--in  { background-color: var(--color-success-subtle); color: var(--color-success); }
        .stock-pill--low { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .stock-pill--out { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .stock-pill__dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background-color: currentColor;
          flex-shrink: 0;
        }

        /* description + specs sections */
        .pd-tabs {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          border-top: 1px solid var(--color-border);
          padding-top: 2rem;
        }
        .pd-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pd-section__title {
          font-size: 1.0625rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.01em;
          padding-bottom: 0.625rem;
          border-bottom: 2px solid var(--color-accent);
          display: inline-block;
        }
        .pd-description {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.8;
          white-space: pre-wrap;
        }

        /* specs table */
        .pd-specs-wrap { overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
        .pd-specs-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .pd-specs-row--even { background-color: var(--color-background); }
        .pd-specs-key {
          padding: 0.625rem 1rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-align: start;
          white-space: nowrap;
          width: 12rem;
          border-inline-end: 1px solid var(--color-border);
        }
        .pd-specs-val {
          padding: 0.625rem 1rem;
          color: var(--color-text);
        }
        .pd-specs-table tr + tr .pd-specs-key,
        .pd-specs-table tr + tr .pd-specs-val {
          border-top: 1px solid var(--color-border-subtle);
        }

        .tabular { font-variant-numeric: tabular-nums; }
      `}</style>
    </>
  )
}
