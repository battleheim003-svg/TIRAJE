import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
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
    },
  })

  if (!product || !product.isActive) notFound()

  // Query related products from same brand or category
  const relatedProducts = await db.product.findMany({
    where: {
      isActive: true,
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
  const factoryName = product.factory
    ? fa
      ? product.factory.nameFa
    : (product.factory.nameEn ?? product.factory.nameFa)
    : "کارخانجات سیمان شرق"

  const stockKey = product.stockStatus as string
  const stockLabel = STOCK_LABEL[stockKey] ?? STOCK_LABEL.IN_STOCK!
  const stockVariant = STOCK_VARIANT[stockKey] ?? "in"
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

  const specs = (product.technicalSpecs as Record<string, string> | null) ?? null

  const images = product.images as {
    id: string
    url: string
    altFa?: string | null
    altEn?: string | null
    isPrimary: boolean
  }[]

  // Calculate per ton price (50kg bag -> 20 bags = 1 ton)
  const pricePerTon = priceNum * 20

  return (
    <>
      <div className="pd-container">
        {/* ── Breadcrumb ── */}
        <nav className="pd-breadcrumb" aria-label={fa ? "مسیر دسترسی" : "Breadcrumb"}>
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
          <span className="pd-breadcrumb__link pd-breadcrumb__brand">
            {brandName}
          </span>
          <span className="pd-breadcrumb__sep" aria-hidden="true">/</span>
          <span className="pd-breadcrumb__current" aria-current="page">{name}</span>
        </nav>

        {/* ── Back button ── */}
        <Link href={`/${locale}/products`} className="pd-back">
          <BackIcon style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden="true" />
          {fa ? "بازگشت به فهرست محصولات" : "Back to Products"}
        </Link>

        {/* ── Main Hero Layout (2 Columns) ── */}
        <div className="pd-hero-grid">
          {/* Column 1: Gallery & Trust Signals */}
          <div className="pd-gallery-col">
            <ImageGallery images={images} productName={name} locale={locale} />

            {/* Quick Logistics highlights */}
            <div className="pd-trust-card">
              <div className="pd-trust-item">
                <Truck className="pd-trust-icon" />
                <div>
                  <h4 className="pd-trust-title">{fa ? "ارسال به سراسر کشور" : "Nationwide Delivery"}</h4>
                  <p className="pd-trust-desc">{fa ? "تریلی (۲۴ تن)، جفت (۱۵ تن) و تک (۱۰ تن)" : "Full and partial loads"}</p>
                </div>
              </div>
              <div className="pd-trust-item">
                <FileCheck2 className="pd-trust-icon" />
                <div>
                  <h4 className="pd-trust-title">{fa ? "برگه آنالیز آزمایشگاهی" : "Certified Lab Analysis"}</h4>
                  <p className="pd-trust-desc">{fa ? "ارائه برگه استاندارد و آنالیز روز کارخانه" : "Official factory certificate"}</p>
                </div>
              </div>
              <div className="pd-trust-item">
                <ShieldCheck className="pd-trust-icon" />
                <div>
                  <h4 className="pd-trust-title">{fa ? "ضمانت اصالت تیراژه" : "100% Genuine Product"}</h4>
                  <p className="pd-trust-desc">{fa ? "عرضه مستقیم بدون واسطه از خط تولید" : "Direct from manufacturer"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Product Info & Commerce Box */}
          <div className="pd-info-col">
            {/* Brand Header */}
            <div className="pd-brand-bar">
              <Link href={`/${locale}/products?brand=${product.brand.slug}`} className="pd-brand-chip">
                {product.brand.logoUrl && (
                  <img
                    src={product.brand.logoUrl}
                    alt={brandName}
                    className="pd-brand-logo"
                  />
                )}
                <span>{brandName}</span>
              </Link>
              <span className="pd-symbol-chip">
                {fa ? "نماد:" : "Symbol:"} <strong>Cement</strong>
              </span>
            </div>

            {/* Product Title */}
            <h1 className="pd-title">{name}</h1>
            {product.nameEn && <p className="pd-title-en">{product.nameEn}</p>}

            {/* Spec Badges */}
            <div className="pd-chips-row">
              {cementLabel && (
                <span className="pd-chip pd-chip--type">
                  <Layers style={{ width: "0.875rem", height: "0.875rem" }} />
                  {fa ? cementLabel.fa : cementLabel.en}
                </span>
              )}
              {packLabel && (
                <span className="pd-chip pd-chip--pack">
                  <Boxes style={{ width: "0.875rem", height: "0.875rem" }} />
                  {packLabel.short}
                </span>
              )}
              <span className="pd-chip pd-chip--weight">
                <Scale style={{ width: "0.875rem", height: "0.875rem" }} />
                {formatWeight(product.weightKg, locale)}
              </span>
              <span className="pd-chip pd-chip--cert">
                <Sparkles style={{ width: "0.875rem", height: "0.875rem" }} />
                {fa ? "استاندارد ملی ایران" : "Standard Certified"}
              </span>
            </div>

            {/* Price Card */}
            <div className="pd-price-card">
              <div className="pd-price-header">
                <span className={`stock-pill stock-pill--${stockVariant}`}>
                  <span className="stock-pill__dot" />
                  {fa ? stockLabel.fa : stockLabel.en}
                </span>
                <span className="pd-price-time">
                  <Clock style={{ width: "0.8125rem", height: "0.8125rem" }} />
                  {fa ? "به‌روزرسانی قیمت:" : "Updated:"}{" "}
                  {formatRelativeTime(product.lastPriceUpdate, locale)}
                </span>
              </div>

              <div className="pd-price-main">
                {hasDiscount && (
                  <div className="pd-discount-badge">
                    <span>{discountPct}% {fa ? "تخفیف" : "OFF"}</span>
                    <span className="pd-old-price tabular">
                      {formatPrice(product.comparePrice, locale)}
                    </span>
                  </div>
                )}
                <div className="pd-price-numbers">
                  <span className="pd-current-price tabular">
                    {formatPrice(product.price, locale)}
                  </span>
                  {priceUnit && priceNum > 0 && (
                    <span className="pd-price-unit-label">
                      {fa ? priceUnit.fa : priceUnit.en}
                    </span>
                  )}
                </div>
              </div>

              {/* Ton reference price */}
              <div className="pd-ton-calc">
                <span>{fa ? "برآورد هر تن (۲۰ کیسه):" : "Estimated per ton:"}</span>
                <strong className="tabular">{formatPrice(pricePerTon, locale)}</strong>
              </div>
            </div>

            {/* Interactive Add to Cart & Calculation */}
            <div className="pd-commerce-box">
              <AddToCartButton
                productId={product.id}
                minOrderQty={product.minOrderQty || 10}
                stockStatus={product.stockStatus as string}
                locale={locale}
                unitPrice={priceNum}
                unitWeightKg={Number(product.weightKg) || 50}
              />
            </div>

            {/* 6 Key Commerce Cards (from tirajeconcrete.com) */}
            <div className="pd-specs-grid">
              <div className="pd-spec-box">
                <Boxes className="pd-spec-icon" />
                <div className="pd-spec-text">
                  <span className="pd-spec-label">{fa ? "موجودی انبار" : "Stock Status"}</span>
                  <span className="pd-spec-val">{fa ? "موجود در انبار مشهد" : "In Stock (Mashhad)"}</span>
                </div>
              </div>

              <div className="pd-spec-box">
                <Scale className="pd-spec-icon" />
                <div className="pd-spec-text">
                  <span className="pd-spec-label">{fa ? "حداقل سفارش" : "Min Order"}</span>
                  <span className="pd-spec-val">{fa ? "۱۰ کیسه (۲۴۰ عمده)" : "10 bags (240 bulk)"}</span>
                </div>
              </div>

              <div className="pd-spec-box">
                <FileCheck2 className="pd-spec-icon" />
                <div className="pd-spec-text">
                  <span className="pd-spec-label">{fa ? "نوع فروش" : "Sale Type"}</span>
                  <span className="pd-spec-val">{fa ? "نقدی و اعتباری / استعلامی" : "Cash & Inquiry"}</span>
                </div>
              </div>

              <div className="pd-spec-box">
                <Truck className="pd-spec-icon" />
                <div className="pd-spec-text">
                  <span className="pd-spec-label">{fa ? "هزینه ارسال" : "Shipping Cost"}</span>
                  <span className="pd-spec-val">{fa ? "پس‌کرایه با باربری معتبر" : "Pay upon receipt"}</span>
                </div>
              </div>

              <div className="pd-spec-box">
                <RotateCcw className="pd-spec-icon" />
                <div className="pd-spec-text">
                  <span className="pd-spec-label">{fa ? "تضمین کیفیت" : "Quality Guarantee"}</span>
                  <span className="pd-spec-val">{fa ? "تضمین اصالت با برگه آنالیز" : "Lab Certified"}</span>
                </div>
              </div>

              <div className="pd-spec-box">
                <Building2 className="pd-spec-icon" />
                <div className="pd-spec-text">
                  <span className="pd-spec-label">{fa ? "محل بارگیری" : "Pickup Location"}</span>
                  <span className="pd-spec-val">{factoryLocation}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs / Detailed Sections ── */}
        <div className="pd-details-section">
          {/* Section 1: Detailed Overview & Advantages */}
          <section className="pd-card-section">
            <h2 className="pd-section-heading">
              <Sparkles style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
              {fa ? "معرفی و مشخصات تخصصی سیمان مرکب" : "Product Overview & Features"}
            </h2>

            <div className="pd-prose">
              {description ? (
                <div className="pd-desc-content">
                  {description.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <p>
                  {fa
                    ? "سیمان پرتلند مرکب شرق حاصل آسیاب همزمان کلینکر مرغوب با مواد فعال پوزولانی و فیلرهای معدنی است که به دلیل حرارت هیدراتاسیون پایین و نفوذپذیری اندک، انتخابی ایده‌آل برای بتن‌ریزی‌های حجیم و سازه‌های مقاوم در برابر عوامل خورنده است."
                    : "Shargh composite Portland cement is engineered with active pozzolans for lower hydration heat and high durability."}
                </p>
              )}
            </div>

            {/* 4 Feature Highlights Cards */}
            <div className="pd-features-grid">
              <div className="pd-feature-card">
                <Flame className="pd-feature-icon" />
                <h3 className="pd-feature-title">{fa ? "حرارت هیدراتاسیون پایین" : "Low Hydration Heat"}</h3>
                <p className="pd-feature-text">
                  {fa
                    ? "کاهش تنش‌های حرارتی و پیشگیری از بروز ترک‌های انقباضی در فونداسیون‌های گسترده و بتن‌ریزی‌های حجیم."
                    : "Minimizes thermal stresses and cracking in mass concreting."}
                </p>
              </div>

              <div className="pd-feature-card">
                <ShieldAlert className="pd-feature-icon" />
                <h3 className="pd-feature-title">{fa ? "مقاومت در برابر سولفات‌ها" : "Chemical Resistance"}</h3>
                <p className="pd-feature-text">
                  {fa
                    ? "کاهش چشمگیر نفوذپذیری یون کلر و آب‌های اسیدی و نمک‌های خورنده در خاک‌های مهاجم و مناطق مرطوب."
                    : "Enhanced durability against sulfate and chloride attacks."}
                </p>
              </div>

              <div className="pd-feature-card">
                <Droplets className="pd-feature-icon" />
                <h3 className="pd-feature-title">{fa ? "کارایی و روانی فوق‌العاده ملات" : "Superior Workability"}</h3>
                <p className="pd-feature-text">
                  {fa
                    ? "چسبندگی استثنایی و روانی عالی در کارهای بنایی، سیمان‌کاری، کاشی‌کاری و تولید قطعات پیش‌ساخته."
                    : "Exceptional adhesion and pumpability for masonry and plastering."}
                </p>
              </div>

              <div className="pd-feature-card">
                <CheckCircle2 className="pd-feature-icon" />
                <h3 className="pd-feature-title">{fa ? "مقاومت درازمدت مطلوب" : "Long-Term Strength"}</h3>
                <p className="pd-feature-text">
                  {fa
                    ? "رشد پیوسته مقاومت فشاری پس از ۲۸ روز به دلیل ادامه فعالیت ژل سیلیکاتی ناشی از واکنش پوزولانی."
                    : "Continuous strength gain over time due to pozzolanic reactions."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Technical Specifications Table */}
          {specs && Object.keys(specs).length > 0 && (
            <section className="pd-card-section">
              <h2 className="pd-section-heading">
                <FileCheck2 style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
                {fa ? "جدول مشخصات فنی و فیزیکی-شیمیایی" : "Technical & Chemical Specifications"}
              </h2>
              <div className="pd-table-wrap">
                <table className="pd-table">
                  <thead>
                    <tr>
                      <th style={{ width: "45%" }}>{fa ? "پارامتر استاندارد و آزمایشگاهی" : "Parameter"}</th>
                      <th>{fa ? "مقدار / نتیجه آزمون کارخانه" : "Value / Test Result"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(specs).map(([key, value], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? "pd-tr--alt" : ""}>
                        <td className="pd-td-key">{key}</td>
                        <td className="pd-td-val tabular">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 3: Logistics, Storage & Fleet Guide */}
          <section className="pd-card-section">
            <h2 className="pd-section-heading">
              <Truck style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
              {fa ? "راهنمای حمل، نگهداری و بارگیری" : "Storage & Transport Guide"}
            </h2>

            <div className="pd-logistics-grid">
              <div className="pd-logistics-box">
                <h3 className="pd-logistics-subtitle">{fa ? "ناوگان حمل و ظرفیت بارگیری" : "Fleet Capacities"}</h3>
                <ul className="pd-logistics-list">
                  <li><strong>{fa ? "تریلی کفی / لبه‌دار:" : "Semi-Trailer:"}</strong> {fa ? "۴۸۰ کیسه (۲۴ تن)" : "480 bags (24 Tons)"}</li>
                  <li><strong>{fa ? "کامیون جفت (۱۰ چرخ):" : "Double-axle Truck:"}</strong> {fa ? "۳۰۰ کیسه (۱۵ تن)" : "300 bags (15 Tons)"}</li>
                  <li><strong>{fa ? "کامیون تک (۶ چرخ):" : "Single-axle Truck:"}</strong> {fa ? "۲۰۰ کیسه (۱۰ تن)" : "200 bags (10 Tons)"}</li>
                  <li><strong>{fa ? "خاور و نیسان:" : "Light Truck / Pickup:"}</strong> {fa ? "۴۰ الی ۱۰۰ کیسه (۲ تا ۵ تن)" : "40 to 100 bags (2-5 Tons)"}</li>
                </ul>
              </div>

              <div className="pd-logistics-box">
                <h3 className="pd-logistics-subtitle">{fa ? "دستورالعمل نگهداری در کارگاه" : "Storage Instructions"}</h3>
                <ul className="pd-logistics-list">
                  <li>{fa ? "کیسه‌ها حتماً روی پالت چوبی و با فاصله ۱۰ سانتی‌متری از زمین چیده شوند." : "Store on wooden pallets off the ground."}</li>
                  <li>{fa ? "حداکثر ارتفاع چیدمان برای جلوگیری از فشردگی و کلوخه‌شدن، ۱۰ ردیف کیسه است." : "Stack max 10 bags high."}</li>
                  <li>{fa ? "فاصله مناسب حداقل ۳۰ سانتی‌متر از دیوارهای کارگاه حفظ شود." : "Keep 30cm away from walls."}</li>
                  <li>{fa ? "در فصول بارندگی و محیط‌های مرطوب با روکش ضدآب نایلونی پوشانده شود." : "Cover with waterproof sheets in rain/humidity."}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Direct B2B Contact Banner */}
          <div className="pd-contact-banner">
            <div className="pd-contact-content">
              <PhoneCall className="pd-contact-icon" />
              <div>
                <h3 className="pd-contact-title">
                  {fa ? "مشاوره فنی بتن و استعلام قیمت تناژ بالا" : "Need Bulk Supply or Technical Consultation?"}
                </h3>
                <p className="pd-contact-desc">
                  {fa
                    ? "برای پروژه‌های انبوه‌سازی، سدسازی، قطعات پیش‌ساخته و استعلام بارگیری مستقیم از درب کارخانه با کارشناسان تیراژه تماس حاصل فرمایید."
                    : "Contact our concrete sales engineers for factory-direct dispatches and custom quotes."}
                </p>
              </div>
            </div>
            <div className="pd-contact-phones">
              <a href="tel:05138331904" className="pd-phone-btn">
                <span>۰۵۱-۳۸۳۳۱۹۰۴</span>
                <small>{fa ? "دفتر مرکزی مشهد" : "Head Office"}</small>
              </a>
              <a href="tel:09155300631" className="pd-phone-btn pd-phone-btn--secondary">
                <span>۰۹۱۵۵۳۰۰۶۳۱</span>
                <small>{fa ? "واحد فروش و بارگیری" : "Dispatch Unit"}</small>
              </a>
            </div>
          </div>

          {/* Section 5: Related Products */}
          {relatedProducts.length > 0 && (
            <section className="pd-card-section">
              <h2 className="pd-section-heading">
                <Boxes style={{ width: "1.25rem", height: "1.25rem", color: "var(--color-accent)" }} />
                {fa ? "محصولات مرتبط و مشابه" : "Related Products"}
              </h2>

              <div className="pd-related-grid">
                {relatedProducts.map((p) => {
                  const pImg = p.images?.[0]?.url
                  const pName = fa ? p.nameFa : (p.nameEn ?? p.nameFa)
                  const pBrand = fa ? p.brand.nameFa : (p.brand.nameEn ?? p.brand.nameFa)

                  return (
                    <Link
                      key={p.id}
                      href={`/${locale}/products/${p.slug}`}
                      className="pd-related-card"
                    >
                      <div className="pd-related-img-wrap">
                        {pImg ? (
                          <Image
                            src={pImg}
                            alt={pName}
                            fill
                            unoptimized={true}
                            sizes="12rem"
                            className="pd-related-img"
                          />
                        ) : (
                          <Boxes className="pd-related-placeholder" />
                        )}
                      </div>
                      <div className="pd-related-info">
                        <span className="pd-related-brand">{pBrand}</span>
                        <h3 className="pd-related-name">{pName}</h3>
                        <div className="pd-related-price tabular">
                          {formatPrice(p.price, locale)}
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

      <style>{`
        .pd-container {
          max-width: 80rem;
          margin-inline: auto;
          padding-inline: 1.25rem;
          padding-block: 1.5rem 5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Breadcrumb */
        .pd-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
        .pd-breadcrumb__link {
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .pd-breadcrumb__link:hover { color: var(--color-accent); }
        .pd-breadcrumb__brand { font-weight: 600; color: var(--color-text); }
        .pd-breadcrumb__sep { color: var(--color-border); user-select: none; }
        .pd-breadcrumb__current { color: var(--color-accent); font-weight: 700; }

        /* Back button */
        .pd-back {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color 0.15s ease;
          align-self: flex-start;
        }
        .pd-back:hover { color: var(--color-accent); }

        /* Hero Grid */
        .pd-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: start;
        }
        @media (min-width: 992px) {
          .pd-hero-grid {
            grid-template-columns: 5fr 7fr;
            gap: 2.5rem;
          }
        }

        /* Gallery Column */
        .pd-gallery-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .pd-trust-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pd-trust-item {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }
        .pd-trust-icon {
          width: 1.35rem;
          height: 1.35rem;
          color: var(--color-accent);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        .pd-trust-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 0.125rem;
        }
        .pd-trust-desc {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        /* Info Column */
        .pd-info-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .pd-brand-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .pd-brand-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 9999px;
          padding: 0.25rem 0.875rem 0.25rem 0.5rem;
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text);
          transition: border-color 0.15s ease;
        }
        .pd-brand-chip:hover { border-color: var(--color-accent); }
        .pd-brand-logo {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          object-fit: cover;
        }
        .pd-symbol-chip {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        .pd-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        .pd-title-en {
          font-size: 0.9375rem;
          color: var(--color-text-muted);
          margin-top: -0.5rem;
        }

        .pd-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .pd-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
        }
        .pd-chip--type {
          border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
          color: var(--color-accent);
          background-color: color-mix(in srgb, var(--color-accent) 8%, transparent);
        }
        .pd-chip--cert {
          border-color: rgba(16, 185, 129, 0.4);
          color: #10b981;
          background-color: rgba(16, 185, 129, 0.08);
        }

        /* Price Card */
        .pd-price-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .pd-price-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .pd-price-time {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .pd-price-main {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .pd-price-numbers {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .pd-current-price {
          font-size: 2rem;
          font-weight: 900;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .pd-price-unit-label {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text-muted);
        }
        .pd-discount-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 800;
          background-color: #ef4444;
          color: #ffffff;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
        }
        .pd-old-price {
          text-decoration: line-through;
          opacity: 0.8;
          font-weight: 600;
        }
        .pd-ton-calc {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px dashed var(--color-border);
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
        .pd-ton-calc strong {
          font-size: 0.9375rem;
          color: var(--color-accent);
        }

        /* 6-box specs grid (from tirajeconcrete.com) */
        .pd-specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .pd-specs-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .pd-spec-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 0.875rem 1rem;
        }
        .pd-spec-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .pd-spec-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .pd-spec-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
        .pd-spec-val {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--color-text);
        }

        /* Content Sections */
        .pd-details-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-top: 1.5rem;
        }
        .pd-card-section {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .pd-section-heading {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-text);
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .pd-prose {
          font-size: 0.9375rem;
          line-height: 1.9;
          color: var(--color-text-secondary);
        }
        .pd-desc-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          white-space: pre-line;
        }

        /* Feature Cards */
        .pd-features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        @media (min-width: 640px) {
          .pd-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .pd-features-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .pd-feature-card {
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .pd-feature-icon {
          width: 2rem;
          height: 2rem;
          color: var(--color-accent);
        }
        .pd-feature-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .pd-feature-text {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        /* Technical Table */
        .pd-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        .pd-table {
          width: 100%;
          border-collapse: collapse;
          text-align: right;
          font-size: 0.875rem;
        }
        .pd-table th {
          background-color: var(--color-background);
          color: var(--color-text);
          font-weight: 700;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--color-border);
        }
        .pd-table td {
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-secondary);
        }
        .pd-tr--alt {
          background-color: color-mix(in srgb, var(--color-background) 50%, transparent);
        }
        .pd-td-key {
          font-weight: 600;
          color: var(--color-text);
        }
        .pd-td-val {
          color: var(--color-accent);
          font-weight: 700;
        }

        /* Logistics Grid */
        .pd-logistics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .pd-logistics-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pd-logistics-box {
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
        }
        .pd-logistics-subtitle {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 1rem;
        }
        .pd-logistics-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.7;
        }
        .pd-logistics-list li {
          position: relative;
          padding-inline-start: 1.25rem;
        }
        .pd-logistics-list li::before {
          content: "•";
          position: absolute;
          inset-inline-start: 0;
          color: var(--color-accent);
          font-size: 1.25rem;
          line-height: 1;
        }

        /* Contact Banner */
        .pd-contact-banner {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
        }
        .pd-contact-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          max-width: 42rem;
        }
        .pd-contact-icon {
          width: 3rem;
          height: 3rem;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .pd-contact-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.375rem;
        }
        .pd-contact-desc {
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.7;
        }
        .pd-contact-phones {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .pd-phone-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          background-color: var(--color-accent);
          color: #ffffff;
          text-decoration: none;
          border-radius: var(--radius-lg);
          font-weight: 800;
          font-size: 1.125rem;
          font-variant-numeric: tabular-nums;
          transition: transform 0.15s ease, background-color 0.15s ease;
        }
        .pd-phone-btn small {
          font-size: 0.6875rem;
          font-weight: 600;
          opacity: 0.9;
        }
        .pd-phone-btn:hover {
          background-color: var(--color-accent-hover);
          transform: translateY(-2px);
        }
        .pd-phone-btn--secondary {
          background-color: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .pd-phone-btn--secondary:hover {
          background-color: rgba(255, 255, 255, 0.18);
        }

        /* Related Products Grid */
        .pd-related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .pd-related-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .pd-related-card {
          display: flex;
          flex-direction: column;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          text-decoration: none;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .pd-related-card:hover {
          transform: translateY(-4px);
          border-color: var(--color-accent);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
        }
        .pd-related-img-wrap {
          position: relative;
          aspect-ratio: 1;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-related-img {
          object-fit: contain;
          padding: 1rem;
        }
        .pd-related-placeholder {
          width: 3rem;
          height: 3rem;
          color: #94a3b8;
        }
        .pd-related-info {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .pd-related-brand {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--color-text-muted);
        }
        .pd-related-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--color-text);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pd-related-price {
          font-size: 0.9375rem;
          font-weight: 800;
          color: var(--color-accent);
          margin-top: 0.25rem;
        }
      `}</style>
    </>
  )
}
