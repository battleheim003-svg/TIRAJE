import Link from "next/link"
import Image from "next/image"
import { MapPin, Package, Clock } from "lucide-react"
import {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  PRICE_UNIT,
  STOCK_LABEL,
  STOCK_VARIANT,
  formatPrice,
  formatRelativeTime,
  formatWeight,
} from "@/lib/cement"

export interface ProductCardData {
  id: string
  slug: string
  nameFa: string
  nameEn?: string | null
  price: unknown
  comparePrice?: unknown | null
  weightKg: unknown
  packagingType: string
  cementType?: string | null
  cementGrade?: string | null
  stockStatus: string
  lastPriceUpdate: Date | string
  images: { url: string; altFa?: string | null; altEn?: string | null }[]
  brand: { nameFa: string; nameEn?: string | null }
  factory?: { nameFa: string; nameEn?: string | null; province: string; city: string } | null
}

interface ProductCardProps {
  product: ProductCardData
  locale: string
  /** compact = homepage grid; full = listing page (default) */
  variant?: "compact" | "full"
}

export function ProductCard({ product, locale, variant = "full" }: ProductCardProps) {
  const fa = locale === "fa"
  const name = fa ? product.nameFa : (product.nameEn ?? product.nameFa)
  const brandName = fa
    ? product.brand.nameFa
    : (product.brand.nameEn ?? product.brand.nameFa)
  const factoryLocation = product.factory
    ? fa
      ? `${product.factory.city}، ${product.factory.province}`
      : `${product.factory.city}, ${product.factory.province}`
    : null

  const stockKey = product.stockStatus
  const stockLabel = STOCK_LABEL[stockKey] ?? STOCK_LABEL.OUT_OF_STOCK!
  const stockVariant = STOCK_VARIANT[stockKey] ?? "out"
  const isAvailable = stockVariant !== "out"

  const cementLabel = product.cementType
    ? (CEMENT_TYPE_LABEL[product.cementType] ?? null)
    : null
  const packLabel = PACKAGING_LABEL[product.packagingType]
  const priceUnit = PRICE_UNIT[product.packagingType]
  const img = product.images[0]

  const compareNum = Number(product.comparePrice)
  const priceNum = Number(product.price)
  const hasDiscount = compareNum > 0 && compareNum > priceNum

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="prod-card"
      aria-label={`${name} — ${fa ? stockLabel.fa : stockLabel.en}`}
      data-product-id={product.id}
    >
      {/* Image */}
      <div className="prod-card__img" aria-hidden="true">
        {img ? (
          <Image
            src={img.url}
            alt={fa ? (img.altFa ?? name) : (img.altEn ?? name)}
            fill
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
            className="prod-card__image"
          />
        ) : (
          <span className="prod-card__no-img" aria-hidden="true">
            <Package style={{ width: "2.5rem", height: "2.5rem" }} />
          </span>
        )}
        {hasDiscount && (
          <span className="prod-card__discount-badge" aria-label={fa ? "تخفیف" : "Discount"}>
            {Math.round((1 - priceNum / compareNum) * 100)}%
          </span>
        )}
      </div>

      {/* Body */}
      <div className="prod-card__body">
        {/* Brand */}
        <p className="prod-card__brand">{brandName}</p>

        {/* Name */}
        <h3 className="prod-card__name">{name}</h3>

        {/* Type + Packaging chips */}
        <div className="prod-card__chips" aria-label={fa ? "مشخصات" : "Specs"}>
          {cementLabel && (
            <span className="chip chip--type">
              {fa ? cementLabel.fa : cementLabel.en}
            </span>
          )}
          {packLabel && (
            <span className="chip chip--pack">
              {packLabel.short}
            </span>
          )}
        </div>

        {/* Weight + Factory */}
        <div className="prod-card__meta">
          <span className="prod-card__weight" title={fa ? "وزن واحد" : "Unit weight"}>
            {formatWeight(product.weightKg, locale)}
          </span>
          {factoryLocation && (
            <span className="prod-card__factory">
              <MapPin style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0 }} aria-hidden="true" />
              {factoryLocation}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="prod-card__divider" role="separator" aria-hidden="true" />

        {/* Stock + Price row */}
        <div className="prod-card__price-row">
          <span
            className={`stock-pill stock-pill--${stockVariant}`}
            aria-label={fa ? stockLabel.fa : stockLabel.en}
          >
            <span className="stock-pill__dot" aria-hidden="true" />
            {fa ? stockLabel.fa : stockLabel.en}
          </span>
          <div className="prod-card__prices">
            {hasDiscount && (
              <span className="prod-card__compare" aria-label={fa ? "قیمت قبل" : "Was"}>
                {formatPrice(product.comparePrice, locale)}
              </span>
            )}
            <span
              className={`prod-card__price ${!isAvailable ? "prod-card__price--unavailable" : ""}`}
              aria-label={fa ? "قیمت" : "Price"}
            >
              {formatPrice(product.price, locale)}
            </span>
            {priceUnit && Number(product.price) > 0 && (
              <span className="prod-card__price-unit" aria-hidden="true">
                {fa ? priceUnit.fa : priceUnit.en}
              </span>
            )}
          </div>
        </div>

        {/* Last price update */}
        <p className="prod-card__update">
          <Clock style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0 }} aria-hidden="true" />
          <span>
            {fa ? "آخرین به‌روزرسانی قیمت:" : "Price updated:"}{" "}
            {formatRelativeTime(product.lastPriceUpdate, locale)}
          </span>
        </p>
      </div>

      {/* Scoped styles */}
      <style>{`
        .prod-card {
          display: flex;
          flex-direction: column;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: box-shadow var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
          text-decoration: none;
          color: inherit;
        }
        .prod-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-3px);
          border-color: var(--color-accent);
        }
        .prod-card:hover .prod-card__image {
          transform: scale(1.05);
        }
        .prod-card:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .prod-card__img {
          position: relative;
          aspect-ratio: 1;
          background-color: var(--color-background);
          overflow: hidden;
          flex-shrink: 0;
        }
        .prod-card__image {
          object-fit: contain;
          padding: 0.75rem;
          transition: transform var(--transition-fast);
        }
        .prod-card__no-img {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }
        .prod-card__discount-badge {
          position: absolute;
          top: 0.5rem;
          inset-inline-start: 0.5rem;
          background-color: var(--color-danger);
          color: #fff;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 0.1rem 0.375rem;
          border-radius: var(--radius-sm);
          line-height: 1.4;
        }

        .prod-card__body {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          padding: 0.875rem;
          flex: 1;
        }

        .prod-card__brand {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--color-accent);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1;
        }

        .prod-card__name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .prod-card__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-top: 0.125rem;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-sm);
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .chip--type {
          background-color: var(--color-accent-subtle);
          color: var(--color-accent);
        }
        .chip--pack {
          background-color: var(--color-border-subtle);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
        }

        .prod-card__meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.375rem 0.75rem;
          margin-top: 0.125rem;
        }
        .prod-card__weight {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          font-variant-numeric: tabular-nums;
        }
        .prod-card__factory {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }

        .prod-card__divider {
          height: 1px;
          background-color: var(--color-border-subtle);
          margin-block: 0.375rem;
        }

        .prod-card__price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        /* stock pill */
        .stock-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.175rem 0.5rem;
          border-radius: 9999px;
        }
        .stock-pill--in  { background-color: var(--color-success-subtle); color: var(--color-success); }
        .stock-pill--low { background-color: var(--color-warning-subtle); color: var(--color-warning); }
        .stock-pill--out { background-color: var(--color-danger-subtle);  color: var(--color-danger);  }
        .stock-pill__dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
          background-color: currentColor;
          flex-shrink: 0;
        }

        .prod-card__prices {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.1rem;
        }
        .prod-card__compare {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          text-decoration: line-through;
          font-variant-numeric: tabular-nums;
        }
        .prod-card__price {
          font-size: 0.875rem;
          font-weight: 800;
          color: var(--color-accent);
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .prod-card__price--unavailable {
          color: var(--color-text-muted);
          font-weight: 600;
        }
        .prod-card__price-unit {
          font-size: 0.5625rem;
          font-weight: 500;
          color: var(--color-text-muted);
          text-align: end;
          line-height: 1;
        }

        .prod-card__update {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.625rem;
          color: var(--color-text-muted);
          margin-top: auto;
          padding-top: 0.25rem;
        }
      `}</style>
    </Link>
  )
}
