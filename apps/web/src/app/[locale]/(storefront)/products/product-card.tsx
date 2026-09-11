import Link from "next/link"
import Image from "next/image"
import { MapPin, Package, Clock } from "lucide-react"
import { Badge } from "@tirajeh/ui"
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
import styles from "./ProductCard.module.css"

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

export function ProductCard({ product, locale }: ProductCardProps) {
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

  const badgeVariant =
    stockVariant === "in"
      ? "success"
      : stockVariant === "low"
        ? "warning"
        : "danger"

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className={styles["web-pcard"]}
      aria-label={`${name} — ${fa ? stockLabel.fa : stockLabel.en}`}
      data-product-id={product.id}
    >
      {/* Image */}
      <div className={styles["web-pcard__img-wrap"]} aria-hidden="true">
        {img ? (
          <Image
            src={img.url}
            alt={fa ? (img.altFa ?? name) : (img.altEn ?? name)}
            fill
            draggable={false}
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
            className={styles["web-pcard__img"]}
          />
        ) : (
          <span className={styles["web-pcard__img-placeholder"]} aria-hidden="true">
            <Package style={{ width: "2.5rem", height: "2.5rem" }} />
          </span>
        )}
        {hasDiscount && (
          <span
            className={styles["web-pcard__discount-badge"]}
            aria-label={fa ? "تخفیف" : "Discount"}
          >
            {Math.round((1 - priceNum / compareNum) * 100)}%
          </span>
        )}
        <span className={styles["web-pcard__wholesale-badge"]}>
          {fa ? "عمده" : "Bulk"}
        </span>
      </div>

      {/* Body */}
      <div className={styles["web-pcard__body"]}>
        {/* Brand */}
        <p className={styles["web-pcard__brand"]}>{brandName}</p>

        {/* Name */}
        <h3 className={styles["web-pcard__name"]}>{name}</h3>

        {/* Type + Packaging chips */}
        <div className={styles["web-pcard__chips"]} aria-label={fa ? "مشخصات" : "Specs"}>
          {cementLabel && (
            <Badge variant="primary">
              {fa ? cementLabel.fa : cementLabel.en}
            </Badge>
          )}
          {packLabel && (
            <Badge variant="neutral">
              {packLabel.short}
            </Badge>
          )}
        </div>

        {/* Weight + Factory */}
        <div className={styles["web-pcard__meta"]}>
          <span className={styles["web-pcard__weight"]} title={fa ? "وزن واحد" : "Unit weight"}>
            {formatWeight(product.weightKg, locale)}
          </span>
          {factoryLocation && (
            <span className={styles["web-pcard__factory"]}>
              <MapPin
                style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0 }}
                aria-hidden="true"
              />
              {factoryLocation}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className={styles["web-pcard__divider"]} role="separator" aria-hidden="true" />

        {/* Stock + Price row */}
        <div className={styles["web-pcard__price-row"]}>
          <Badge variant={badgeVariant} dot>
            {fa ? stockLabel.fa : stockLabel.en}
          </Badge>
          <div className={styles["web-pcard__prices"]}>
            {hasDiscount && (
              <span className={styles["web-pcard__compare"]} aria-label={fa ? "قیمت قبل" : "Was"}>
                {formatPrice(product.comparePrice, locale)}
              </span>
            )}
            <span
              className={`${styles["web-pcard__price"]} ${
                !isAvailable ? styles["web-pcard__price--unavailable"] : ""
              }`}
              aria-label={fa ? "قیمت" : "Price"}
            >
              {formatPrice(product.price, locale)}
            </span>
            {priceUnit && Number(product.price) > 0 && (
              <span className={styles["web-pcard__price-unit"]} aria-hidden="true">
                {fa ? priceUnit.fa : priceUnit.en}
              </span>
            )}
          </div>
        </div>

        {/* Last price update */}
        <p className={styles["web-pcard__update"]}>
          <Clock
            style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0 }}
            aria-hidden="true"
          />
          <span>
            {fa ? "آخرین به‌روزرسانی قیمت:" : "Price updated:"}{" "}
            {formatRelativeTime(product.lastPriceUpdate, locale)}
          </span>
        </p>
      </div>
    </Link>
  )
}