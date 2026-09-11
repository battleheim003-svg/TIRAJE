import Link from "next/link"
import Image from "next/image"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  ShieldCheck,
  Factory,
  Award,
  PhoneCall,
  BarChart3,
  CheckCircle2,
  Mountain,
  Wrench,
  Layers,
  Home,
  Cylinder,
  Package,
} from "lucide-react"
import { Button } from "@tirajeh/ui"
import { SITE_CONFIG } from "@/config/site"
import { ProductCard } from "./products/product-card"
import styles from "./HomePage.module.css"

export const metadata: Metadata = {
  title: "تیراژه | مرجع تأمین سیمان و مصالح ساختمانی",
  description:
    "خرید مستقیم سیمان، شن و ماسه، آهن‌آلات و مصالح ساختمانی از کارخانه با ضمانت اصالت، قیمت مناسب و تحویل سراسری",
}

// ─── category icon (Lucide, no emoji) ──────────────────────────────────────

const CAT_ICON_STYLE = { width: "2rem", height: "2rem" }

function CategoryIcon({ slug }: { slug: string }) {
  if (slug.includes("cement") || slug.includes("سیمان"))
    return <Factory style={CAT_ICON_STYLE} aria-hidden="true" />
  if (slug.includes("aggregate") || slug.includes("شن") || slug.includes("ماسه"))
    return <Mountain style={CAT_ICON_STYLE} aria-hidden="true" />
  if (slug.includes("steel") || slug.includes("آهن") || slug.includes("فولاد"))
    return <Wrench style={CAT_ICON_STYLE} aria-hidden="true" />
  if (slug.includes("block") || slug.includes("آجر") || slug.includes("بلوک"))
    return <Layers style={CAT_ICON_STYLE} aria-hidden="true" />
  if (slug.includes("roof") || slug.includes("سقف") || slug.includes("پوشش"))
    return <Home style={CAT_ICON_STYLE} aria-hidden="true" />
  if (slug.includes("pipe") || slug.includes("لوله") || slug.includes("مخزن"))
    return <Cylinder style={CAT_ICON_STYLE} aria-hidden="true" />
  return <Package style={CAT_ICON_STYLE} aria-hidden="true" />
}

// ─── page ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const locale = await getLocale()
  const fa = locale === "fa"
  const Arrow = fa ? ArrowLeft : ArrowRight

  const [featuredProducts, categories, recentPosts, productCount, brandCount] =
    await Promise.all([
      db.product.findMany({
        where: { isFeatured: true, isActive: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          brand: true,
          factory: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        take: 8,
      }),
      db.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
      db.product.count({ where: { isActive: true } }),
      db.brand.count({ where: { isActive: true } }),
    ])

  // ─── content maps ──────────────────────────────────────────────────────

  const hero = {
    eyebrow: fa ? "مستقیم از کارخانه" : "Direct from Factory",
    headline: fa
      ? "مرجع تأمین سیمان\nو مصالح ساختمانی"
      : "Cement & Construction\nMaterials Hub",
    sub: fa
      ? "قیمت کارخانه‌ای، تحویل سراسری، ضمانت اصالت کالا"
      : "Factory pricing · Nationwide delivery · Authenticity guarantee",
    ctaB2C: fa ? "مشاهده محصولات" : "Browse Products",
    ctaB2B: fa ? "درخواست قیمت عمده" : "Request Bulk Quote",
  }

  const stats = [
    {
      value:
        productCount > 0
          ? fa
            ? productCount.toLocaleString("fa-IR")
            : productCount.toString()
          : fa
            ? "۱۰۰+"
            : "100+",
      label: fa ? "محصول فعال" : "Active Products",
    },
    {
      value:
        brandCount > 0
          ? fa
            ? brandCount.toLocaleString("fa-IR")
            : brandCount.toString()
          : fa
            ? "۳۰+"
            : "30+",
      label: fa ? "برند معتبر" : "Trusted Brands",
    },
    {
      value: fa
        ? SITE_CONFIG.provincesCovered.toLocaleString("fa-IR")
        : SITE_CONFIG.provincesCovered.toString(),
      label: fa ? "استان تحت پوشش" : "Provinces Covered",
    },
    {
      value: fa ? SITE_CONFIG.supportHours.fa : SITE_CONFIG.supportHours.en,
      label: fa ? "پشتیبانی آنلاین" : "Online Support",
    },
  ]

  const trustItems = [
    {
      icon: ShieldCheck,
      title: fa ? "ضمانت اصالت کالا" : "Authenticity Guarantee",
      desc: fa
        ? "تمام محصولات با مدارک رسمی کارخانه"
        : "All products with official factory documentation",
    },
    {
      icon: Truck,
      title: fa ? "حمل سراسری" : "Nationwide Shipping",
      desc: fa
        ? "تحویل به تمام استان‌ها با ناوگان تخصصی"
        : "Delivery to all provinces with dedicated fleet",
    },
    {
      icon: Factory,
      title: fa ? "مستقیم از کارخانه" : "Factory Direct",
      desc: fa
        ? "بدون واسطه، کمترین قیمت بازار"
        : "No middlemen — best market price guaranteed",
    },
    {
      icon: Award,
      title: fa ? "کیفیت تأیید‌شده" : "Certified Quality",
      desc: fa
        ? "استانداردهای ملی و بین‌المللی"
        : "National and international standards",
    },
  ]

  const steps = fa
    ? [
        {
          n: "۱",
          title: "انتخاب و سفارش",
          desc: "محصول مورد نظر را انتخاب کنید و سفارش را ثبت نمایید",
        },
        {
          n: "۲",
          title: "تأیید و قیمت‌گذاری",
          desc: "کارشناسان ما در کوتاه‌ترین زمان قیمت نهایی را تأیید می‌کنند",
        },
        {
          n: "۳",
          title: "تحویل درب کارگاه",
          desc: "محموله با ناوگان تخصصی به محل پروژه شما ارسال می‌شود",
        },
      ]
    : [
        {
          n: "1",
          title: "Select & Order",
          desc: "Browse and place your order online in minutes",
        },
        {
          n: "2",
          title: "Confirm & Price",
          desc: "Our team confirms availability and final pricing quickly",
        },
        {
          n: "3",
          title: "Deliver on Site",
          desc: "Dedicated freight delivers to your project location",
        },
      ]

  return (
    <div className={styles["web-home"]}>
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className={styles["web-home__hero"]} aria-label={fa ? "معرفی تیراژه" : "About Tirajeh"}>
        <div className={`${styles["web-home__container"]} ${styles["web-home__hero-inner"]}`}>
          <div>
            <p className={styles["web-home__hero-eyebrow"]}>{hero.eyebrow}</p>
            <h1 className={styles["web-home__hero-title"]}>
              {hero.headline.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </h1>
            <p className={styles["web-home__hero-sub"]}>{hero.sub}</p>
            <div className={styles["web-home__hero-actions"]}>
              <Button asChild variant="primary" size="lg">
                <Link
                  href={`/${locale}/products`}
                  aria-label={fa ? "مشاهده همه محصولات" : "Browse all products"}
                >
                  {hero.ctaB2C}
                  <Arrow style={{ width: "1.125rem", height: "1.125rem", marginInlineStart: "0.5rem" }} aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link
                  href={`/${locale}/quote`}
                  aria-label={fa ? "درخواست قیمت برای خرید عمده" : "Request bulk quote"}
                >
                  {hero.ctaB2B}
                </Link>
              </Button>
            </div>
          </div>
          <div className={styles["web-home__hero-visual"]} aria-hidden="true">
            <Image
              src="/hero-logo-3d.png"
              alt={fa ? "تیراژه صنعت خاک" : "Tirajeh Sanat Khak"}
              width={1494}
              height={1566}
              priority
              className={styles["web-home__hero-logo-3d"]}
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────── STATS BAR ─────────────────────────── */}
      <section className={styles["web-home__stats-bar"]} aria-label={fa ? "آمار تیراژه" : "Tirajeh at a glance"}>
        <div className={`${styles["web-home__container"]} ${styles["web-home__stats-inner"]}`}>
          {stats.map((s) => (
            <div key={s.label} className={styles["web-home__stat-item"]}>
              <span className={styles["web-home__stat-value"]}>{s.value}</span>
              <span className={styles["web-home__stat-label"]}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── TRUST STRIP ─────────────────────────── */}
      <section className={styles["web-home__trust-section"]} aria-label={fa ? "مزایای تیراژه" : "Why Tirajeh"}>
        <div className={`${styles["web-home__container"]} ${styles["web-home__trust-grid"]}`}>
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <article key={title} className={styles["web-home__trust-card"]}>
              <span className={styles["web-home__trust-icon"]} aria-hidden="true">
                <Icon style={{ width: "1.5rem", height: "1.5rem" }} />
              </span>
              <div>
                <h3 className={styles["web-home__trust-title"]}>{title}</h3>
                <p className={styles["web-home__trust-desc"]}>{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── CATEGORIES ─────────────────────────── */}
      {(categories as any[]).length > 0 && (
        <section className={styles["web-home__section-gap"]} aria-labelledby="cats-heading">
          <div className={styles["web-home__container"]}>
            <div className={styles["web-home__section-header"]}>
              <h2 id="cats-heading" className={styles["web-home__section-title"]}>
                {fa ? "دسته‌بندی محصولات" : "Product Categories"}
              </h2>
              <Link
                href={`/${locale}/products`}
                className={styles["web-home__section-link"]}
                aria-label={fa ? "مشاهده همه محصولات" : "View all products"}
              >
                {fa ? "همه محصولات" : "All products"}
                <Arrow style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles["web-home__cat-grid"]} role="list">
              {(categories as any[]).map((cat) => {
                const name = fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)
                return (
                  <Link
                    key={cat.id}
                    href={`/${locale}/products?category=${cat.slug}`}
                    className={styles["web-home__cat-card"]}
                    role="listitem"
                    aria-label={name}
                  >
                    <span className={styles["web-home__cat-img-wrap"]} aria-hidden="true">
                      {cat.imageUrl ? (
                        <Image
                          src={cat.imageUrl}
                          alt=""
                          width={56}
                          height={56}
                          style={{ width: "3.5rem", height: "3.5rem", objectFit: "contain" }}
                        />
                      ) : (
                        <span className={styles["web-home__cat-icon-wrap"]}>
                          <CategoryIcon slug={cat.slug} />
                        </span>
                      )}
                    </span>
                    <span className={styles["web-home__cat-name"]}>{name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────── FEATURED PRODUCTS ─────────────────────────── */}
      {(featuredProducts as any[]).length > 0 && (
        <section className={styles["web-home__featured-section"]} aria-labelledby="feat-heading">
          <div className={styles["web-home__container"]}>
            <div className={styles["web-home__section-header"]}>
              <h2 id="feat-heading" className={styles["web-home__section-title"]}>
                {fa ? "محصولات ویژه" : "Featured Products"}
              </h2>
              <Link
                href={`/${locale}/products?featured=1`}
                className={styles["web-home__section-link"]}
                aria-label={fa ? "مشاهده همه محصولات ویژه" : "View all featured products"}
              >
                {fa ? "مشاهده همه" : "View all"}
                <Arrow style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles["web-home__prod-grid"]} role="list">
              {(featuredProducts as any[]).map((product) => (
                <div key={product.id} role="listitem">
                  <ProductCard product={product as any} locale={locale} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────── B2B CALLOUT ─────────────────────────── */}
      <section className={styles["web-home__b2b-section"]} aria-labelledby="b2b-heading">
        <div className={`${styles["web-home__container"]} ${styles["web-home__b2b-inner"]}`}>
          <div className={styles["web-home__b2b-content"]}>
            <p className={styles["web-home__b2b-eyebrow"]}>
              {fa ? "برای پیمانکاران و انبوه‌سازان" : "For Contractors & Developers"}
            </p>
            <h2 id="b2b-heading" className={styles["web-home__b2b-title"]}>
              {fa ? "خرید عمده با قیمت کارخانه" : "Bulk Purchasing at Factory Price"}
            </h2>
            <p className={styles["web-home__b2b-desc"]}>
              {fa
                ? "تأمین مصالح پروژه‌های بزرگ با قراردادهای بلندمدت، فاکتور رسمی، حمل تخصصی و تخفیف حجمی"
                : "Supply large projects with long-term contracts, official invoicing, specialized freight and volume discounts"}
            </p>
            <ul className={styles["web-home__b2b-features"]} role="list">
              {(fa
                ? [
                    "فاکتور رسمی با ارزش‌افزوده",
                    "حمل با ناوگان تخصصی",
                    "تخفیف حجمی",
                    "پشتیبانی اختصاصی",
                  ]
                : [
                    "Official VAT invoicing",
                    "Specialized freight fleet",
                    "Volume discounts",
                    "Dedicated account manager",
                  ]
              ).map((item) => (
                <li key={item} className={styles["web-home__b2b-feature-item"]}>
                  <CheckCircle2
                    style={{ width: "1rem", height: "1rem", flexShrink: 0, color: "var(--color-primary-400)" }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div className={styles["web-home__b2b-actions"]}>
              <Button asChild variant="primary" size="lg">
                <Link href={`/${locale}/quote`}>
                  {fa ? "درخواست قیمت عمده" : "Request Bulk Quote"}
                  <Arrow style={{ width: "1.125rem", height: "1.125rem", marginInlineStart: "0.5rem" }} aria-hidden="true" />
                </Link>
              </Button>
              <Link href={`/${locale}/freight`} className={styles["web-home__b2b-freight-link"]}>
                <BarChart3 style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
                {fa ? "محاسبه هزینه حمل" : "Calculate Freight Cost"}
              </Link>
            </div>
          </div>
          <div
            className={styles["web-home__b2b-cta-box"]}
            aria-label={fa ? "تماس با کارشناسان" : "Contact specialists"}
          >
            <PhoneCall
              style={{ width: "2.5rem", height: "2.5rem", color: "var(--color-primary-400)" }}
              aria-hidden="true"
            />
            <p className={styles["web-home__b2b-cta-title"]}>{fa ? "مشاوره رایگان" : "Free Consultation"}</p>
            <p className={styles["web-home__b2b-cta-sub"]}>
              {fa
                ? "کارشناسان ما آماده پاسخگویی هستند"
                : "Our specialists are ready to help"}
            </p>
            <a
              href={`tel:${SITE_CONFIG.phone.raw}`}
              className={styles["web-home__b2b-phone"]}
              aria-label={fa ? "تماس با تیراژه" : "Call Tirajeh"}
            >
              {SITE_CONFIG.phone.fa}
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */}
      <section className={styles["web-home__steps-section"]} aria-labelledby="steps-heading">
        <div className={styles["web-home__container"]}>
          <h2 id="steps-heading" className={`${styles["web-home__section-title"]} ${styles["web-home__steps-title"]}`}>
            {fa ? "چگونه کار می‌کند؟" : "How It Works"}
          </h2>
          <ol className={styles["web-home__steps-grid"]} role="list">
            {steps.map((step) => (
              <li key={step.n} className={styles["web-home__step-item"]}>
                <span className={styles["web-home__step-number"]} aria-hidden="true">
                  {step.n}
                </span>
                <h3 className={styles["web-home__step-title"]}>{step.title}</h3>
                <p className={styles["web-home__step-desc"]}>{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────────────── BLOG ─────────────────────────── */}
      {(recentPosts as any[]).length > 0 && (
        <section className={styles["web-home__blog-section"]} aria-labelledby="blog-heading">
          <div className={styles["web-home__container"]}>
            <div className={styles["web-home__section-header"]}>
              <h2 id="blog-heading" className={styles["web-home__section-title"]}>
                {fa ? "مجله فنی تیراژه" : "Technical Journal"}
              </h2>
              <Link
                href={`/${locale}/blog`}
                className={styles["web-home__section-link"]}
                aria-label={fa ? "همه مقالات" : "All articles"}
              >
                {fa ? "همه مقالات" : "All articles"}
                <Arrow style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles["web-home__blog-grid"]} role="list">
              {(recentPosts as any[]).map((post) => {
                const title = fa ? post.titleFa : (post.titleEn ?? post.titleFa)
                const excerpt = fa
                  ? post.excerptFa
                  : ((post as any).excerptEn ?? post.excerptFa)
                return (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className={styles["web-home__blog-card"]}
                    role="listitem"
                    aria-label={title}
                  >
                    {post.featuredImage && (
                      <div className={styles["web-home__blog-img-wrap"]} aria-hidden="true">
                        <Image
                          src={post.featuredImage}
                          alt=""
                          fill
                          sizes="(max-width:768px) 100vw,33vw"
                          className={styles["web-home__blog-img"]}
                        />
                      </div>
                    )}
                    <div className={styles["web-home__blog-body"]}>
                      <h3 className={styles["web-home__blog-title"]}>{title}</h3>
                      {excerpt && <p className={styles["web-home__blog-excerpt"]}>{excerpt}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────── BOTTOM CTA ─────────────────────────── */}
      <section className={styles["web-home__bottom-cta"]} aria-label={fa ? "شروع خرید" : "Get started"}>
        <div className={`${styles["web-home__container"]} ${styles["web-home__bottom-cta-inner"]}`}>
          <h2 className={styles["web-home__bottom-cta-title"]}>
            {fa ? "آماده سفارش هستید؟" : "Ready to Order?"}
          </h2>
          <p className={styles["web-home__bottom-cta-sub"]}>
            {fa
              ? "همین حالا محصولات را مرور کنید یا با کارشناسان ما مشورت کنید"
              : "Browse products now or consult with our specialists"}
          </p>
          <div className={styles["web-home__hero-actions"]}>
            <Button asChild variant="primary" size="lg">
              <Link href={`/${locale}/products`}>
                {fa ? "مشاهده محصولات" : "Browse Products"}
                <Arrow style={{ width: "1.125rem", height: "1.125rem", marginInlineStart: "0.5rem" }} aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={`/${locale}/contact`}>
                {fa ? "تماس با ما" : "Contact Us"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}