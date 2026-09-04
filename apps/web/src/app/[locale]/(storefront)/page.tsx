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
import { SITE_CONFIG } from "@/config/site"
import { ProductCard } from "./products/product-card"

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
    <>
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="hero-section" aria-label={fa ? "معرفی تیراژه" : "About Tirajeh"}>
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-inner">
          <p className="hero-eyebrow">{hero.eyebrow}</p>
          <h1 className="hero-headline">
            {hero.headline.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>
          <p className="hero-sub">{hero.sub}</p>
          <div className="hero-actions">
            <Link
              href={`/${locale}/products`}
              className="btn-primary-lg"
              aria-label={fa ? "مشاهده همه محصولات" : "Browse all products"}
            >
              {hero.ctaB2C}
              <Arrow className="btn-icon" aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}/quote`}
              className="btn-outline-lg"
              aria-label={fa ? "درخواست قیمت برای خرید عمده" : "Request bulk quote"}
            >
              {hero.ctaB2B}
            </Link>
          </div>
        </div>
        <div className="hero-grid" aria-hidden="true" />
      </section>

      {/* ─────────────────────────── STATS BAR ─────────────────────────── */}
      <section className="stats-bar" aria-label={fa ? "آمار تیراژه" : "Tirajeh at a glance"}>
        <div className="container stats-inner">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <span className="stat-value tabular">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── TRUST STRIP ─────────────────────────── */}
      <section className="trust-section" aria-label={fa ? "مزایای تیراژه" : "Why Tirajeh"}>
        <div className="container trust-grid">
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="trust-card">
              <span className="trust-icon" aria-hidden="true">
                <Icon style={{ width: "1.5rem", height: "1.5rem" }} />
              </span>
              <div>
                <h3 className="trust-title">{title}</h3>
                <p className="trust-desc">{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── CATEGORIES ─────────────────────────── */}
      {(categories as any[]).length > 0 && (
        <section className="section-gap" aria-labelledby="cats-heading">
          <div className="container">
            <div className="section-header">
              <h2 id="cats-heading" className="section-title">
                {fa ? "دسته‌بندی محصولات" : "Product Categories"}
              </h2>
              <Link
                href={`/${locale}/products`}
                className="section-link"
                aria-label={fa ? "مشاهده همه محصولات" : "View all products"}
              >
                {fa ? "همه محصولات" : "All products"}
                <Arrow style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              </Link>
            </div>
            <div className="cat-grid" role="list">
              {(categories as any[]).map((cat) => {
                const name = fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)
                return (
                  <Link
                    key={cat.id}
                    href={`/${locale}/products?category=${cat.slug}`}
                    className="cat-card"
                    role="listitem"
                    aria-label={name}
                  >
                    <span className="cat-img-wrap" aria-hidden="true">
                      {cat.imageUrl ? (
                        <Image
                          src={cat.imageUrl}
                          alt=""
                          width={56}
                          height={56}
                          style={{ width: "3.5rem", height: "3.5rem" }}
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <span className="cat-icon-wrap">
                          <CategoryIcon slug={cat.slug} />
                        </span>
                      )}
                    </span>
                    <span className="cat-name">{name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────── FEATURED PRODUCTS ─────────────────────────── */}
      {(featuredProducts as any[]).length > 0 && (
        <section className="featured-section" aria-labelledby="feat-heading">
          <div className="container">
            <div className="section-header">
              <h2 id="feat-heading" className="section-title">
                {fa ? "محصولات ویژه" : "Featured Products"}
              </h2>
              <Link
                href={`/${locale}/products?featured=1`}
                className="section-link"
                aria-label={fa ? "مشاهده همه محصولات ویژه" : "View all featured products"}
              >
                {fa ? "مشاهده همه" : "View all"}
                <Arrow style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              </Link>
            </div>
            <div className="prod-grid" role="list">
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
      <section className="b2b-section" aria-labelledby="b2b-heading">
        <div className="container b2b-inner">
          <div className="b2b-content">
            <p className="b2b-eyebrow">
              {fa ? "برای پیمانکاران و انبوه‌سازان" : "For Contractors & Developers"}
            </p>
            <h2 id="b2b-heading" className="b2b-title">
              {fa ? "خرید عمده با قیمت کارخانه" : "Bulk Purchasing at Factory Price"}
            </h2>
            <p className="b2b-desc">
              {fa
                ? "تأمین مصالح پروژه‌های بزرگ با قراردادهای بلندمدت، فاکتور رسمی، حمل تخصصی و تخفیف حجمی"
                : "Supply large projects with long-term contracts, official invoicing, specialized freight and volume discounts"}
            </p>
            <ul className="b2b-features" role="list">
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
                <li key={item} className="b2b-feature-item">
                  <CheckCircle2
                    style={{ width: "1rem", height: "1rem", flexShrink: 0, color: "var(--color-accent)" }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div className="b2b-actions">
              <Link href={`/${locale}/quote`} className="btn-primary-lg">
                {fa ? "درخواست قیمت عمده" : "Request Bulk Quote"}
                <Arrow className="btn-icon" aria-hidden="true" />
              </Link>
              <Link href={`/${locale}/freight`} className="b2b-freight-link">
                <BarChart3 style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
                {fa ? "محاسبه هزینه حمل" : "Calculate Freight Cost"}
              </Link>
            </div>
          </div>
          <div
            className="b2b-cta-box"
            aria-label={fa ? "تماس با کارشناسان" : "Contact specialists"}
          >
            <PhoneCall
              style={{ width: "2.5rem", height: "2.5rem", color: "var(--color-accent)" }}
              aria-hidden="true"
            />
            <p className="b2b-cta-title">{fa ? "مشاوره رایگان" : "Free Consultation"}</p>
            <p className="b2b-cta-sub">
              {fa
                ? "کارشناسان ما آماده پاسخگویی هستند"
                : "Our specialists are ready to help"}
            </p>
            <a
              href={`tel:${SITE_CONFIG.phone.raw}`}
              className="b2b-phone"
              aria-label={fa ? "تماس با تیراژه" : "Call Tirajeh"}
            >
              {SITE_CONFIG.phone.fa}
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */}
      <section className="steps-section" aria-labelledby="steps-heading">
        <div className="container">
          <h2 id="steps-heading" className="section-title steps-title">
            {fa ? "چگونه کار می‌کند؟" : "How It Works"}
          </h2>
          <ol className="steps-grid" role="list">
            {steps.map((step, i) => (
              <li key={step.n} className="step-item">
                <span className="step-number tabular" aria-hidden="true">
                  {step.n}
                </span>
                {i < steps.length - 1 && (
                  <span className="step-connector" aria-hidden="true" />
                )}
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────────────── BLOG ─────────────────────────── */}
      {(recentPosts as any[]).length > 0 && (
        <section className="blog-section" aria-labelledby="blog-heading">
          <div className="container">
            <div className="section-header">
              <h2 id="blog-heading" className="section-title">
                {fa ? "مجله فنی تیراژه" : "Technical Journal"}
              </h2>
              <Link
                href={`/${locale}/blog`}
                className="section-link"
                aria-label={fa ? "همه مقالات" : "All articles"}
              >
                {fa ? "همه مقالات" : "All articles"}
                <Arrow style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden="true" />
              </Link>
            </div>
            <div className="blog-grid" role="list">
              {(recentPosts as any[]).map((post) => {
                const title = fa ? post.titleFa : (post.titleEn ?? post.titleFa)
                const excerpt = fa
                  ? post.excerptFa
                  : ((post as any).excerptEn ?? post.excerptFa)
                return (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="blog-card"
                    role="listitem"
                    aria-label={title}
                  >
                    {post.featuredImage && (
                      <div className="blog-img-wrap" aria-hidden="true">
                        <Image
                          src={post.featuredImage}
                          alt=""
                          fill
                          sizes="(max-width:768px) 100vw,33vw"
                          className="blog-img"
                        />
                      </div>
                    )}
                    <div className="blog-body">
                      <h3 className="blog-title">{title}</h3>
                      {excerpt && <p className="blog-excerpt">{excerpt}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────── BOTTOM CTA ─────────────────────────── */}
      <section className="bottom-cta" aria-label={fa ? "شروع خرید" : "Get started"}>
        <div className="container bottom-cta-inner">
          <h2 className="bottom-cta-title">
            {fa ? "آماده سفارش هستید؟" : "Ready to Order?"}
          </h2>
          <p className="bottom-cta-sub">
            {fa
              ? "همین حالا محصولات را مرور کنید یا با کارشناسان ما مشورت کنید"
              : "Browse products now or consult with our specialists"}
          </p>
          <div className="hero-actions">
            <Link href={`/${locale}/products`} className="btn-primary-lg">
              {fa ? "مشاهده محصولات" : "Browse Products"}
              <Arrow className="btn-icon" aria-hidden="true" />
            </Link>
            <Link href={`/${locale}/contact`} className="btn-outline-lg btn-outline-dark">
              {fa ? "تماس با ما" : "Contact Us"}
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────── page-scoped styles ─────────────── */}
      <style>{`
        /* ── layout ── */
        .container {
          max-width: 80rem;
          margin-inline: auto;
          padding-inline: 1.5rem;
        }
        @media (min-width: 1024px) { .container { padding-inline: 2rem; } }
        .section-gap { padding-block: 4rem; }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          gap: 1rem;
        }
        .section-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        @media (min-width: 768px) { .section-title { font-size: 1.625rem; } }
        .section-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-accent);
          white-space: nowrap;
          transition: opacity var(--transition-fast);
        }
        .section-link:hover { opacity: 0.75; }
        .section-link:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 2px; }

        /* ── hero ── */
        .hero-section {
          position: relative;
          background-color: #0c1420;
          color: #fff;
          overflow: hidden;
          padding-block: 5rem 4.5rem;
        }
        @media (min-width: 768px) { .hero-section { padding-block: 7rem 6rem; } }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 60% 40%, #162b4a 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 3.5rem 3.5rem;
          pointer-events: none;
        }
        .hero-inner { position: relative; z-index: 1; }
        .hero-eyebrow {
          display: inline-block;
          background: rgba(29,111,165,0.25);
          border: 1px solid rgba(29,111,165,0.5);
          color: #7ec8f4;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.875rem;
          border-radius: 9999px;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
        }
        .hero-headline {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #f0f6ff;
          text-wrap: balance;
          margin-bottom: 1.125rem;
          max-width: 30ch;
        }
        .hero-sub {
          font-size: 1.0625rem;
          color: #8fadc7;
          margin-bottom: 2.25rem;
          max-width: 46ch;
        }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }

        /* ── buttons ── */
        .btn-primary-lg {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-lg);
          transition: background-color var(--transition-fast), transform var(--transition-fast);
        }
        .btn-primary-lg:hover { background-color: var(--color-accent-hover); }
        .btn-primary-lg:active { transform: scale(0.98); }
        .btn-primary-lg:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
        .btn-icon { width: 1rem; height: 1rem; }
        .btn-outline-lg {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border: 1.5px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.85);
          font-size: 0.9375rem;
          font-weight: 600;
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-lg);
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
        }
        .btn-outline-lg:hover { background-color: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.5); }
        .btn-outline-lg:focus-visible { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 3px; }
        .btn-outline-dark { border-color: var(--color-border); color: var(--color-text-secondary); }
        .btn-outline-dark:hover { background-color: var(--color-border-subtle); border-color: var(--color-accent); color: var(--color-accent); }

        /* ── stats ── */
        .stats-bar { background-color: var(--color-accent); color: #fff; padding-block: 1.5rem; }
        .stats-inner { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem 0; }
        @media (min-width: 640px) { .stats-inner { grid-template-columns: repeat(4, 1fr); gap: 0; } }
        .stat-item { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.25rem; padding-inline: 1rem; }
        @media (min-width: 640px) {
          .stat-item + .stat-item { border-inline-start: 1px solid rgba(255,255,255,0.2); }
        }
        .stat-value { font-size: 1.875rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
        .stat-label { font-size: 0.75rem; opacity: 0.8; font-weight: 500; }

        /* ── trust ── */
        .trust-section { background-color: var(--color-surface); border-bottom: 1px solid var(--color-border); padding-block: 3rem; }
        .trust-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (min-width: 1024px) { .trust-grid { grid-template-columns: repeat(4, 1fr); } }
        .trust-card { display: flex; align-items: flex-start; gap: 0.875rem; }
        .trust-icon {
          display: flex; align-items: center; justify-content: center;
          width: 2.5rem; height: 2.5rem;
          border-radius: var(--radius-lg);
          background-color: var(--color-accent-subtle);
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .trust-title { font-size: 0.875rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.25rem; }
        .trust-desc { font-size: 0.75rem; color: var(--color-text-secondary); line-height: 1.5; }

        /* ── categories ── */
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
        @media (min-width: 640px) { .cat-grid { gap: 1rem; } }
        @media (min-width: 1024px) { .cat-grid { grid-template-columns: repeat(8, 1fr); } }
        .cat-card {
          display: flex; flex-direction: column; align-items: center; gap: 0.625rem;
          padding: 1rem 0.5rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          text-align: center;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
          text-decoration: none;
          color: inherit;
        }
        .cat-card:hover { border-color: var(--color-accent); box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .cat-card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .cat-img-wrap { width: 3.5rem; height: 3.5rem; display: flex; align-items: center; justify-content: center; }
        .cat-icon-wrap { display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }
        .cat-card:hover .cat-icon-wrap { color: var(--color-accent); }
        .cat-name { font-size: 0.6875rem; font-weight: 600; color: var(--color-text-secondary); transition: color var(--transition-fast); }
        .cat-card:hover .cat-name { color: var(--color-accent); }

        /* ── featured products ── */
        .featured-section { background-color: var(--color-background); padding-block: 4rem; }
        .prod-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (min-width: 640px) { .prod-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .prod-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ── B2B ── */
        .b2b-section { background-color: #0c1420; color: #e6edf3; padding-block: 4.5rem; }
        @media (min-width: 768px) { .b2b-section { padding-block: 5.5rem; } }
        .b2b-inner { display: grid; gap: 3rem; }
        @media (min-width: 1024px) { .b2b-inner { grid-template-columns: 1fr auto; align-items: center; gap: 4rem; } }
        .b2b-eyebrow {
          display: inline-block;
          background: rgba(29,111,165,0.25);
          border: 1px solid rgba(29,111,165,0.45);
          color: #7ec8f4;
          font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em;
          padding: 0.2rem 0.75rem; border-radius: 9999px; margin-bottom: 1rem;
        }
        .b2b-title { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 800; letter-spacing: -0.025em; color: #f0f6ff; margin-bottom: 0.875rem; text-wrap: balance; }
        .b2b-desc { font-size: 0.9375rem; color: #8fadc7; line-height: 1.7; max-width: 52ch; margin-bottom: 1.5rem; }
        .b2b-features { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }
        .b2b-feature-item { display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; color: #adbac7; }
        .b2b-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
        .b2b-freight-link {
          display: inline-flex; align-items: center; gap: 0.375rem;
          font-size: 0.875rem; font-weight: 600; color: #7ec8f4;
          transition: opacity var(--transition-fast);
        }
        .b2b-freight-link:hover { opacity: 0.75; }
        .b2b-freight-link:focus-visible { outline: 2px solid #7ec8f4; outline-offset: 2px; border-radius: 2px; }
        .b2b-cta-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-xl);
          padding: 2.5rem 2rem;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem;
          min-width: 220px;
        }
        .b2b-cta-title { font-size: 1rem; font-weight: 700; color: #f0f6ff; margin-top: 0.5rem; }
        .b2b-cta-sub { font-size: 0.8125rem; color: #8fadc7; }
        .b2b-phone { display: block; margin-top: 0.75rem; font-size: 1.125rem; font-weight: 700; color: #7ec8f4; letter-spacing: 0.04em; direction: ltr; transition: opacity var(--transition-fast); }
        .b2b-phone:hover { opacity: 0.8; }
        .b2b-phone:focus-visible { outline: 2px solid #7ec8f4; outline-offset: 2px; border-radius: 2px; }

        .steps-title { text-align: center; margin-bottom: 2.5rem; }

        /* ── steps ── */
        .steps-section { background-color: var(--color-surface); border-block: 1px solid var(--color-border); padding-block: 4rem; }
        .steps-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
        @media (min-width: 768px) { .steps-grid { grid-template-columns: repeat(3, 1fr); gap: 0; } }
        .step-item { display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; padding-inline: 1.5rem; }
        .step-number {
          width: 3.5rem; height: 3.5rem; border-radius: 50%;
          background-color: var(--color-accent-subtle); color: var(--color-accent);
          font-size: 1.375rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.125rem; position: relative; z-index: 1;
        }
        .step-connector { display: none; }
        @media (min-width: 768px) {
          .step-connector {
            display: block; position: absolute;
            top: 1.75rem;
            inset-inline-start: calc(50% + 1.75rem);
            width: calc(100% - 3.5rem); height: 1px;
            background: linear-gradient(to right, var(--color-accent), var(--color-border));
            opacity: 0.4;
          }
          [dir="rtl"] .step-connector {
            background: linear-gradient(to left, var(--color-accent), var(--color-border));
          }
        }
        .step-title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.5rem; }
        .step-desc { font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.6; max-width: 26ch; margin-inline: auto; }

        /* ── blog ── */
        .blog-section { background-color: var(--color-background); padding-block: 4rem; }
        .blog-grid { display: grid; gap: 1.25rem; }
        @media (min-width: 640px) { .blog-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .blog-grid { grid-template-columns: repeat(3, 1fr); } }
        .blog-card {
          background-color: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-xl); overflow: hidden;
          display: flex; flex-direction: column;
          transition: box-shadow var(--transition-base), transform var(--transition-base);
          text-decoration: none; color: inherit;
        }
        .blog-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
        .blog-card:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .blog-img-wrap { position: relative; height: 10rem; overflow: hidden; background-color: var(--color-background); }
        .blog-img { object-fit: cover; transition: transform var(--transition-base); }
        .blog-card:hover .blog-img { transform: scale(1.05); }
        .blog-body { padding: 1.125rem; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .blog-title {
          font-size: 0.9375rem; font-weight: 700; color: var(--color-text); line-height: 1.45;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          transition: color var(--transition-fast);
        }
        .blog-card:hover .blog-title { color: var(--color-accent); }
        .blog-excerpt {
          font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.6;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        /* ── bottom CTA ── */
        .bottom-cta { background-color: var(--color-accent-subtle); padding-block: 4rem; }
        .bottom-cta-inner { text-align: center; }
        .bottom-cta-title { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; color: var(--color-accent); margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .bottom-cta-sub { font-size: 1rem; color: var(--color-text-secondary); margin-bottom: 2rem; }
        .bottom-cta .hero-actions { justify-content: center; }
        .bottom-cta .btn-outline-lg { border-color: var(--color-accent); color: var(--color-accent); }
        .bottom-cta .btn-outline-lg:hover { background-color: var(--color-accent); color: #fff; }

        /* ── tabular ── */
        .tabular { font-variant-numeric: tabular-nums; }
      `}</style>
    </>
  )
}
