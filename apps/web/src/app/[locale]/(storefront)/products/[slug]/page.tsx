import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Scale,
  Truck,
  ShieldCheck,
  Boxes,
  FileCheck2,
  RotateCcw,
  Building2,
  PhoneCall,
  CheckCircle2,
  Sparkles,
  Layers,
  Flame,
  ShieldAlert,
  Droplets,
} from "lucide-react"
import { Badge } from "@tirajeh/ui"
import {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
  STOCK_VARIANT,
  PRICE_UNIT,
  formatToman,
  formatWeight,
  formatJalali,
  formatRelativeFa,
} from "@/lib/cement"
import { ImageGallery } from "./image-gallery"
import AddToCartButton, { type PackagingOption } from "./add-to-cart"
import styles from "./ProductDetail.module.css"

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
      product.descriptionFa?.slice(0, 160) ??
      product.descriptionEn?.slice(0, 160) ??
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
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      factory: true,
      productCategories: { include: { category: true } },
      priceHistory: { orderBy: { createdAt: "desc" }, take: 1 },
      packagingOptions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  })

  if (!product || !product.isActive || product.archivedAt) notFound()

  // Query related products from same brand or category
  const relatedProducts = await db.product.findMany({
    where: {
      isActive: true,
      archivedAt: null,
      id: { not: product.id },
      OR: [
        { brandId: product.brandId },
        { cementType: product.cementType },
      ],
    },
    include: {
      brand: { select: { nameFa: true, nameEn: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 4,
  })

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
    : "مشهد، خراسان رضوی"

  const stockKey = product.stockStatus as string
  const stockLabel = STOCK_LABEL[stockKey] ?? STOCK_LABEL.IN_STOCK!
  const stockVariant = STOCK_VARIANT[stockKey] ?? "in"

  const cementLabel = product.cementType
    ? (CEMENT_TYPE_LABEL[product.cementType as string] ?? null)
    : null
  const packLabel = PACKAGING_LABEL[product.packagingType as string] ?? null
  const priceUnit = PRICE_UNIT[product.packagingType as string] ?? null

  const priceNum = Number(product.price)
  const compareNum = Number(product.comparePrice ?? 0)
  const hasDiscount = compareNum > 0 && compareNum > priceNum
  const discountPct = hasDiscount ? Math.round((1 - priceNum / compareNum) * 100) : 0

  const specs = (product.technicalSpecs as Record<string, string> | null) ?? null

  const packagingOptions: PackagingOption[] = product.packagingOptions.map((o) => ({
    id: o.id,
    tier: o.tier,
    labelFa: o.labelFa,
    labelEn: o.labelEn,
    bagCount: o.bagCount,
    price: Number(o.price),
  }))

  const images = product.images as {
    id: string
    url: string
    altFa?: string | null
    altEn?: string | null
    isPrimary: boolean
  }[]

  // Calculate per ton price (50kg bag -> 20 bags = 1 ton)
  const pricePerTon = priceNum * 20

  const isUpdatedToday = Boolean(
    product.lastPriceUpdate &&
      new Date(product.lastPriceUpdate).toDateString() === new Date().toDateString()
  )

  const lastPriceUpdateJalali = product.lastPriceUpdate
    ? formatJalali(product.lastPriceUpdate)
    : null

  const latestHistory = product.priceHistory?.[0] ?? null
  const hasHistoryPriceDiff =
    latestHistory &&
    Number(latestHistory.oldPrice) > 0 &&
    Number(latestHistory.oldPrice) !== priceNum

  const badgeVariant =
    stockVariant === "in"
      ? "success"
      : stockVariant === "low"
        ? "warning"
        : "danger"

  return (
    <div className={styles["web-pdtl"]}>
      {/* ── Breadcrumb ── */}
      <nav className={styles["web-pdtl__breadcrumb"]} aria-label={fa ? "مسیر دسترسی" : "Breadcrumb"}>
        <Link href={`/${locale}`} className={styles["web-pdtl__breadcrumb-link"]}>
          {fa ? "خانه" : "Home"}
        </Link>
        <span className={styles["web-pdtl__breadcrumb-sep"]} aria-hidden="true">/</span>
        <Link href={`/${locale}/products`} className={styles["web-pdtl__breadcrumb-link"]}>
          {fa ? "محصولات" : "Products"}
        </Link>
        {firstCategory && (
          <>
            <span className={styles["web-pdtl__breadcrumb-sep"]} aria-hidden="true">/</span>
            <Link
              href={`/${locale}/products?category=${firstCategory.slug}`}
              className={styles["web-pdtl__breadcrumb-link"]}
            >
              {fa ? firstCategory.nameFa : (firstCategory.nameEn ?? firstCategory.nameFa)}
            </Link>
          </>
        )}
        <span className={styles["web-pdtl__breadcrumb-sep"]} aria-hidden="true">/</span>
        <span className={`${styles["web-pdtl__breadcrumb-link"]} ${styles["web-pdtl__breadcrumb-brand"]}`}>
          {brandName}
        </span>
        <span className={styles["web-pdtl__breadcrumb-sep"]} aria-hidden="true">/</span>
        <span className={styles["web-pdtl__breadcrumb-current"]} aria-current="page">{name}</span>
      </nav>

      {/* ── Back button ── */}
      <Link href={`/${locale}/products`} className={styles["web-pdtl__back"]}>
        <BackIcon style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden="true" />
        {fa ? "بازگشت به فهرست محصولات" : "Back to Products"}
      </Link>

      {/* ── Main Hero Layout (2 Columns) ── */}
      <div className={styles["web-pdtl__grid"]}>
        {/* Column 1: Gallery & Trust Signals */}
        <div className={styles["web-pdtl__gallery-col"]}>
          <ImageGallery images={images} productName={name} locale={locale} />

          {/* Quick Logistics highlights */}
          <div className={styles["web-pdtl__trust-card"]}>
            <div className={styles["web-pdtl__trust-item"]}>
              <Truck
                className={styles["web-pdtl__trust-icon"]}
                style={{ width: "1.5rem", height: "1.5rem" }}
              />
              <div>
                <h4 className={styles["web-pdtl__trust-title"]}>
                  {fa ? "ارسال به سراسر کشور" : "Nationwide Delivery"}
                </h4>
                <p className={styles["web-pdtl__trust-desc"]}>
                  {fa ? "تریلی (۲۴ تن)، جفت (۱۵ تن) و تک (۱۰ تن)" : "Full and partial loads"}
                </p>
              </div>
            </div>
            <div className={styles["web-pdtl__trust-item"]}>
              <FileCheck2
                className={styles["web-pdtl__trust-icon"]}
                style={{ width: "1.5rem", height: "1.5rem" }}
              />
              <div>
                <h4 className={styles["web-pdtl__trust-title"]}>
                  {fa ? "برگه آنالیز آزمایشگاهی" : "Certified Lab Analysis"}
                </h4>
                <p className={styles["web-pdtl__trust-desc"]}>
                  {fa ? "ارائه برگه استاندارد و آنالیز روز کارخانه" : "Official factory certificate"}
                </p>
              </div>
            </div>
            <div className={styles["web-pdtl__trust-item"]}>
              <ShieldCheck
                className={styles["web-pdtl__trust-icon"]}
                style={{ width: "1.5rem", height: "1.5rem" }}
              />
              <div>
                <h4 className={styles["web-pdtl__trust-title"]}>
                  {fa ? "ضمانت اصالت تیراژه" : "100% Genuine Product"}
                </h4>
                <p className={styles["web-pdtl__trust-desc"]}>
                  {fa ? "عرضه مستقیم بدون واسطه از خط تولید" : "Direct from manufacturer"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Product Info & Commerce Box */}
        <div className={styles["web-pdtl__info-col"]}>
          {/* Brand Header */}
          <div className={styles["web-pdtl__brand-bar"]}>
            <Link href={`/${locale}/products?brand=${product.brand.slug}`} className={styles["web-pdtl__brand-chip"]}>
              {product.brand.logoUrl && (
                <Image
                  src={product.brand.logoUrl}
                  alt={brandName}
                  width={24}
                  height={24}
                  className={styles["web-pdtl__brand-logo"]}
                />
              )}
              <span>{brandName}</span>
            </Link>
            <span className={styles["web-pdtl__symbol-chip"]}>
              {fa ? "نماد:" : "Symbol:"} <strong>Cement</strong>
            </span>
          </div>

          {/* Product Title */}
          <h1 className={styles["web-pdtl__title"]}>{name}</h1>
          {product.nameEn && <p className={styles["web-pdtl__title-en"]}>{product.nameEn}</p>}

          {/* Spec Badges */}
          <div className={styles["web-pdtl__badges"]}>
            {cementLabel && (
              <Badge variant="primary">
                <Layers style={{ width: "0.875rem", height: "0.875rem", marginInlineEnd: "0.25rem" }} />
                {fa ? cementLabel.fa : cementLabel.en}
              </Badge>
            )}
            {packLabel && (
              <Badge variant="neutral">
                <Boxes style={{ width: "0.875rem", height: "0.875rem", marginInlineEnd: "0.25rem" }} />
                {packLabel.short}
              </Badge>
            )}
            <Badge variant="neutral">
              <Scale style={{ width: "0.875rem", height: "0.875rem", marginInlineEnd: "0.25rem" }} />
              {formatWeight(product.weightKg, locale)}
            </Badge>
            <Badge variant="success">
              <Sparkles style={{ width: "0.875rem", height: "0.875rem", marginInlineEnd: "0.25rem" }} />
              {fa ? "استاندارد ملی ایران" : "Standard Certified"}
            </Badge>
          </div>

          {/* Price Card */}
          <div className={styles["web-pdtl__price-card"]}>
            <div className={styles["web-pdtl__price-header"]}>
              <div className={styles["web-pdtl__price-badges-group"]}>
                <Badge variant={badgeVariant} dot>
                  {fa ? stockLabel.fa : stockLabel.en}
                </Badge>
                {isUpdatedToday && (
                  <Badge variant="success">
                    <CheckCircle2 style={{ width: "0.8125rem", height: "0.8125rem", marginInlineEnd: "0.25rem" }} />
                    {fa ? "قیمت به‌روز امروز" : "Updated Today"}
                  </Badge>
                )}
              </div>
              <span className={styles["web-pdtl__price-time"]}>
                <Clock style={{ width: "0.8125rem", height: "0.8125rem" }} />
                {fa
                  ? `آخرین به‌روزرسانی قیمت: ${lastPriceUpdateJalali || (product.lastPriceUpdate ? formatRelativeFa(product.lastPriceUpdate) : "—")}`
                  : `Price updated: ${lastPriceUpdateJalali || "—"}`}
              </span>
            </div>

            <div className={styles["web-pdtl__price-main"]}>
              {hasDiscount ? (
                <div className={styles["web-pdtl__discount-badge"]}>
                  <span>{discountPct}% {fa ? "تخفیف" : "OFF"}</span>
                  <span className={styles["web-pdtl__old-price"]}>
                    {formatToman(product.comparePrice, locale as "fa" | "en")}
                  </span>
                </div>
              ) : (hasHistoryPriceDiff && isUpdatedToday) ? (
                <div className={styles["web-pdtl__discount-badge"]}>
                  <span>{fa ? "قیمت قبل:" : "Prev:"}</span>
                  <span className={styles["web-pdtl__old-price"]}>
                    {formatToman(latestHistory.oldPrice, locale as "fa" | "en")}
                  </span>
                </div>
              ) : null}
              <div className={styles["web-pdtl__price-numbers"]}>
                <span className={styles["web-pdtl__current-price"]}>
                  {formatToman(product.price, locale as "fa" | "en")}
                </span>
                {priceUnit && priceNum > 0 && (
                  <span className={styles["web-pdtl__price-unit-label"]}>
                    {fa ? priceUnit.fa : priceUnit.en}
                  </span>
                )}
              </div>
            </div>

            {/* Ton reference price */}
            <div className={styles["web-pdtl__ton-calc"]}>
              <span>{fa ? "برآورد هر تن (۲۰ کیسه):" : "Estimated per ton:"}</span>
              <strong>{formatToman(pricePerTon, locale as "fa" | "en")}</strong>
            </div>
          </div>

          {/* Interactive Add to Cart & Calculation */}
          <AddToCartButton
            productId={product.id}
            minOrderQty={product.minOrderQty || 10}
            stockStatus={product.stockStatus as string}
            locale={locale}
            unitPrice={priceNum}
            unitWeightKg={Number(product.weightKg) || 50}
            packagingOptions={packagingOptions}
          />

          {/* 6 Key Commerce Cards */}
          <div className={styles["web-pdtl__specs-grid"]}>
            <div className={styles["web-pdtl__spec-box"]}>
              <Boxes className={styles["web-pdtl__spec-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <div className={styles["web-pdtl__spec-text"]}>
                <span className={styles["web-pdtl__spec-label"]}>{fa ? "موجودی انبار" : "Stock Status"}</span>
                <span className={styles["web-pdtl__spec-val"]}>{fa ? "موجود در انبار مشهد" : "In Stock (Mashhad)"}</span>
              </div>
            </div>

            <div className={styles["web-pdtl__spec-box"]}>
              <Scale className={styles["web-pdtl__spec-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <div className={styles["web-pdtl__spec-text"]}>
                <span className={styles["web-pdtl__spec-label"]}>{fa ? "حداقل سفارش" : "Min Order"}</span>
                <span className={styles["web-pdtl__spec-val"]}>
                  {fa
                    ? `۵۰ کیسه (تک) تا ۵۰۰ کیسه (تریلی ۱۰ چرخ)`
                    : "50 bags (single) up to 500 bags (10-wheel trailer)"}
                </span>
              </div>
            </div>

            <div className={styles["web-pdtl__spec-box"]}>
              <FileCheck2 className={styles["web-pdtl__spec-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <div className={styles["web-pdtl__spec-text"]}>
                <span className={styles["web-pdtl__spec-label"]}>{fa ? "نوع فروش" : "Sale Type"}</span>
                <span className={styles["web-pdtl__spec-val"]}>{fa ? "نقدی و اعتباری / استعلامی" : "Cash & Inquiry"}</span>
              </div>
            </div>

            <div className={styles["web-pdtl__spec-box"]}>
              <Truck className={styles["web-pdtl__spec-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <div className={styles["web-pdtl__spec-text"]}>
                <span className={styles["web-pdtl__spec-label"]}>{fa ? "هزینه ارسال" : "Shipping Cost"}</span>
                <span className={styles["web-pdtl__spec-val"]}>{fa ? "پس‌کرایه با باربری معتبر" : "Pay upon receipt"}</span>
              </div>
            </div>

            <div className={styles["web-pdtl__spec-box"]}>
              <RotateCcw className={styles["web-pdtl__spec-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <div className={styles["web-pdtl__spec-text"]}>
                <span className={styles["web-pdtl__spec-label"]}>{fa ? "تضمین کیفیت" : "Quality Guarantee"}</span>
                <span className={styles["web-pdtl__spec-val"]}>{fa ? "تضمین اصالت با برگه آنالیز" : "Lab Certified"}</span>
              </div>
            </div>

            <div className={styles["web-pdtl__spec-box"]}>
              <Building2 className={styles["web-pdtl__spec-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <div className={styles["web-pdtl__spec-text"]}>
                <span className={styles["web-pdtl__spec-label"]}>{fa ? "محل بارگیری" : "Pickup Location"}</span>
                <span className={styles["web-pdtl__spec-val"]}>{factoryLocation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs / Detailed Sections ── */}
      <div className={styles["web-pdtl__details-section"]}>
        {/* Section 1: Detailed Overview & Advantages */}
        <section className={styles["web-pdtl__card-section"]}>
          <h2 className={styles["web-pdtl__section-heading"]}>
            <Sparkles style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
            {fa ? "معرفی و مشخصات تخصصی محصول" : "Product Overview & Features"}
          </h2>

          <div className={styles["web-pdtl__prose"]}>
            {description ? (
              <div>
                {description.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ) : (
              <p>
                {fa
                  ? "سیمان پرتلند تیراژه با کیفیت استاندارد و مشخصات فنی منطبق با آخرین استانداردهای ملی برای مصرف در انواع سازه‌ها و قطعات بتنی."
                  : "Tirajeh portland cement certified according to standard specifications for all construction structures."}
              </p>
            )}
          </div>

          {/* 4 Feature Highlights Cards */}
          <div className={styles["web-pdtl__features-grid"]}>
            <div className={styles["web-pdtl__feature-card"]}>
              <Flame className={styles["web-pdtl__feature-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <h3 className={styles["web-pdtl__feature-title"]}>{fa ? "حرارت هیدراتاسیون مناسب" : "Low Hydration Heat"}</h3>
              <p className={styles["web-pdtl__feature-text"]}>
                {fa
                  ? "کاهش تنش‌های حرارتی و پیشگیری از بروز ترک‌های انقباضی در فونداسیون‌ها و بتن‌ریزی‌های حجیم."
                  : "Minimizes thermal stresses and cracking in mass concreting."}
              </p>
            </div>

            <div className={styles["web-pdtl__feature-card"]}>
              <ShieldAlert className={styles["web-pdtl__feature-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <h3 className={styles["web-pdtl__feature-title"]}>{fa ? "مقاومت در برابر عوامل شیمیایی" : "Chemical Resistance"}</h3>
              <p className={styles["web-pdtl__feature-text"]}>
                {fa
                  ? "کاهش چشمگیر نفوذپذیری یون کلر و آب‌های اسیدی و نمک‌های خورنده در خاک‌های مهاجم."
                  : "Enhanced durability against sulfate and chloride attacks."}
              </p>
            </div>

            <div className={styles["web-pdtl__feature-card"]}>
              <Droplets className={styles["web-pdtl__feature-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <h3 className={styles["web-pdtl__feature-title"]}>{fa ? "کارایی و روانی ملات" : "Superior Workability"}</h3>
              <p className={styles["web-pdtl__feature-text"]}>
                {fa
                  ? "چسبندگی استثنایی و روانی عالی در کارهای بنایی، سیمان‌کاری و قطعات بتنی."
                  : "Exceptional adhesion and pumpability for masonry and plastering."}
              </p>
            </div>

            <div className={styles["web-pdtl__feature-card"]}>
              <CheckCircle2 className={styles["web-pdtl__feature-icon"]} style={{ width: "1.25rem", height: "1.25rem" }} />
              <h3 className={styles["web-pdtl__feature-title"]}>{fa ? "مقاومت درازمدت مطلوب" : "Long-Term Strength"}</h3>
              <p className={styles["web-pdtl__feature-text"]}>
                {fa
                  ? "رشد پیوسته مقاومت فشاری و دوام استثنایی سازه در برابر عوامل محیطی در درازمدت."
                  : "Continuous strength gain over time due to high quality clinker."}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Technical Specifications Table */}
        {specs && Object.keys(specs).length > 0 && (
          <section className={styles["web-pdtl__card-section"]}>
            <h2 className={styles["web-pdtl__section-heading"]}>
              <FileCheck2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
              {fa ? "جدول مشخصات فنی و فیزیکی-شیمیایی" : "Technical & Chemical Specifications"}
            </h2>
            <div className={styles["web-pdtl__table-wrap"]}>
              <table className={styles["web-pdtl__table"]}>
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>{fa ? "پارامتر استاندارد و آزمایشگاهی" : "Parameter"}</th>
                    <th>{fa ? "مقدار / نتیجه آزمون کارخانه" : "Value / Test Result"}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(specs).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? styles["web-pdtl__tr--alt"] : undefined}>
                      <td className={styles["web-pdtl__td-key"]}>{key}</td>
                      <td className={styles["web-pdtl__td-val"]}>{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 3: Logistics, Storage & Fleet Guide */}
        <section className={styles["web-pdtl__card-section"]}>
          <h2 className={styles["web-pdtl__section-heading"]}>
            <Truck style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
            {fa ? "راهنمای حمل، نگهداری و بارگیری" : "Storage & Transport Guide"}
          </h2>

          <div className={styles["web-pdtl__logistics-grid"]}>
            <div className={styles["web-pdtl__logistics-box"]}>
              <h3 className={styles["web-pdtl__logistics-subtitle"]}>{fa ? "ناوگان حمل و ظرفیت بارگیری" : "Fleet Capacities"}</h3>
              <ul className={styles["web-pdtl__logistics-list"]}>
                <li><strong>{fa ? "تریلی ۱۰ چرخ:" : "10-Wheel Trailer:"}</strong> {fa ? "۵۰۰ کیسه (۲۵ تن)" : "500 bags (25 Tons)"}</li>
                <li><strong>{fa ? "تریلی ۶ چرخ:" : "6-Wheel Trailer:"}</strong> {fa ? "۳۶۰ کیسه (۱۸ تن)" : "360 bags (18 Tons)"}</li>
                <li><strong>{fa ? "جفت:" : "Pair:"}</strong> {fa ? "۲۴۰ کیسه (۱۲ تن)" : "240 bags (12 Tons)"}</li>
                <li><strong>{fa ? "تک:" : "Single:"}</strong> {fa ? "۵۰ کیسه (۲.۵ تن)" : "50 bags (2.5 Tons)"}</li>
              </ul>
            </div>

            <div className={styles["web-pdtl__logistics-box"]}>
              <h3 className={styles["web-pdtl__logistics-subtitle"]}>{fa ? "دستورالعمل نگهداری در کارگاه" : "Storage Instructions"}</h3>
              <ul className={styles["web-pdtl__logistics-list"]}>
                <li>{fa ? "کیسه‌ها حتماً روی پالت چوبی و با فاصله ۱۰ سانتی‌متری از زمین چیده شوند." : "Store on wooden pallets off the ground."}</li>
                <li>{fa ? "حداکثر ارتفاع چیدمان برای جلوگیری از فشردگی و کلوخه‌شدن، ۱۰ ردیف کیسه است." : "Stack max 10 bags high."}</li>
                <li>{fa ? "فاصله مناسب حداقل ۳۰ سانتی‌متر از دیوارهای کارگاه حفظ شود." : "Keep 30cm away from walls."}</li>
                <li>{fa ? "در فصول بارندگی و محیط‌های مرطوب با روکش ضدآب نایلونی پوشانده شود." : "Cover with waterproof sheets in rain/humidity."}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Direct B2B Contact Banner */}
        <div className={styles["web-pdtl__contact-banner"]}>
          <div className={styles["web-pdtl__contact-content"]}>
            <PhoneCall
              className={styles["web-pdtl__contact-icon"]}
              style={{ width: "2.5rem", height: "2.5rem" }}
            />
            <div>
              <h3 className={styles["web-pdtl__contact-title"]}>
                {fa ? "مشاوره فنی بتن و استعلام قیمت تناژ بالا" : "Need Bulk Supply or Technical Consultation?"}
              </h3>
              <p className={styles["web-pdtl__contact-desc"]}>
                {fa
                  ? "برای پروژه‌های انبوه‌سازی، سدسازی، قطعات پیش‌ساخته و استعلام بارگیری مستقیم از درب کارخانه با کارشناسان تیراژه تماس حاصل فرمایید."
                  : "Contact our concrete sales engineers for factory-direct dispatches and custom quotes."}
              </p>
            </div>
          </div>
          <div className={styles["web-pdtl__contact-phones"]}>
            <a href="tel:05138331904" className={styles["web-pdtl__phone-btn"]}>
              <span>۰۵۱-۳۸۳۳۱۹۰۴</span>
              <small>{fa ? "دفتر مرکزی مشهد" : "Head Office"}</small>
            </a>
            <a href="tel:09155300631" className={`${styles["web-pdtl__phone-btn"]} ${styles["web-pdtl__phone-btn--secondary"]}`}>
              <span>۰۹۱۵۵۳۰۰۶۳۱</span>
              <small>{fa ? "واحد فروش و بارگیری" : "Dispatch Unit"}</small>
            </a>
          </div>
        </div>

        {/* Section 5: Related Products */}
        {relatedProducts.length > 0 && (
          <section className={styles["web-pdtl__card-section"]}>
            <h2 className={styles["web-pdtl__section-heading"]}>
              <Boxes style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
              {fa ? "محصولات مرتبط و مشابه" : "Related Products"}
            </h2>

            <div className={styles["web-pdtl__related-grid"]}>
              {relatedProducts.map((p) => {
                const pImg = p.images?.[0]?.url
                const pName = fa ? p.nameFa : (p.nameEn ?? p.nameFa)
                const pBrand = fa ? p.brand.nameFa : (p.brand.nameEn ?? p.brand.nameFa)

                return (
                  <Link
                    key={p.id}
                    href={`/${locale}/products/${p.slug}`}
                    className={styles["web-pdtl__related-card"]}
                  >
                    <div className={styles["web-pdtl__related-img-wrap"]}>
                      {pImg ? (
                        <Image
                          src={pImg}
                          alt={pName}
                          fill
                          unoptimized={true}
                          draggable={false}
                          sizes="12rem"
                          className={styles["web-pdtl__related-img"]}
                        />
                      ) : (
                        <Boxes style={{ width: "3rem", height: "3rem", color: "var(--color-text-muted)" }} />
                      )}
                    </div>
                    <div className={styles["web-pdtl__related-info"]}>
                      <span className={styles["web-pdtl__related-brand"]}>{pBrand}</span>
                      <h3 className={styles["web-pdtl__related-name"]}>{pName}</h3>
                      <div className={styles["web-pdtl__related-price"]}>
                        {formatToman(p.price, locale as "fa" | "en")}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}