import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import Link from "next/link"
import { Package, Target, Users, Truck, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "درباره ما | تیراژه",
  description: "تیراژه — مرجع تخصصی خرید سیمان و مصالح ساختمانی از بهترین کارخانه‌های ایران",
}

export default async function AboutPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const values = [
    {
      icon: Target,
      titleFa: "تخصص و تجربه",
      titleEn: "Expertise & Experience",
      descFa: "بیش از یک دهه سابقه در تأمین مواد اولیه ساختمانی برای پروژه‌های کوچک تا بزرگ سراسر کشور.",
      descEn: "Over a decade of experience supplying construction materials for projects of all scales across Iran.",
    },
    {
      icon: ShieldCheck,
      titleFa: "کیفیت تضمین‌شده",
      titleEn: "Guaranteed Quality",
      descFa: "تمامی محصولات مستقیماً از کارخانه‌های معتبر و دارای استاندارد ملی ایران تهیه می‌شوند.",
      descEn: "All products are sourced directly from certified factories with Iranian national standards.",
    },
    {
      icon: Truck,
      titleFa: "تحویل سراسری",
      titleEn: "Nationwide Delivery",
      descFa: "شبکه حمل‌ونقل گسترده ما تحویل به موقع را در تمام استان‌های کشور تضمین می‌کند.",
      descEn: "Our extensive transport network ensures timely delivery to all provinces.",
    },
    {
      icon: Users,
      titleFa: "پشتیبانی متخصص",
      titleEn: "Expert Support",
      descFa: "تیم کارشناسان ما آماده مشاوره در انتخاب محصول، تخمین مقدار و برنامه‌ریزی تأمین هستند.",
      descEn: "Our expert team is ready to advise on product selection, quantity estimation, and supply planning.",
    },
  ]

  const stats = [
    { valueEn: "10+", labelFa: "سال تجربه", labelEn: "Years of experience" },
    { valueEn: "5,000+", labelFa: "مشتری راضی", labelEn: "Satisfied customers" },
    { valueEn: "200+", labelFa: "کارخانه همکار", labelEn: "Partner factories" },
    { valueEn: "31", labelFa: "استان پوشش‌دار", labelEn: "Provinces covered" },
  ]

  return (
    <>
      <main className="ab-root">
        {/* Hero */}
        <section className="ab-hero">
          <div className="ab-hero-inner">
            <div className="ab-hero-icon-wrap">
              <Package className="ab-hero-icon" aria-hidden="true" />
            </div>
            <h1 className="ab-hero-title">
              {fa ? "تیراژه — مرجع مصالح ساختمانی" : "Tirajeh — Construction Materials Hub"}
            </h1>
            <p className="ab-hero-desc">
              {fa
                ? "از سال ۱۳۹۳، تیراژه پل ارتباطی میان کارخانه‌های بزرگ تولیدی و خریداران سراسر ایران بوده است. ما با حذف واسطه‌ها و ایجاد شفافیت قیمتی، خرید مصالح ساختمانی را آسان‌تر، سریع‌تر و مقرون‌به‌صرفه‌تر می‌کنیم."
                : "Since 2014, Tirajeh has bridged major production factories and buyers across Iran. By removing intermediaries and creating price transparency, we make purchasing construction materials easier, faster, and more cost-effective."}
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="ab-stats-section">
          <div className="ab-container">
            <div className="ab-stats">
              {stats.map((s) => (
                <div key={s.valueEn} className="ab-stat">
                  <span className="ab-stat-value">{s.valueEn}</span>
                  <span className="ab-stat-label">{fa ? s.labelFa : s.labelEn}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="ab-values-section">
          <div className="ab-container">
            <h2 className="ab-section-title">{fa ? "چرا تیراژه؟" : "Why Tirajeh?"}</h2>
            <div className="ab-values">
              {values.map((v) => {
                const Icon = v.icon
                return (
                  <div key={v.titleEn} className="ab-value-card">
                    <div className="ab-value-icon-wrap">
                      <Icon className="ab-value-icon" aria-hidden="true" />
                    </div>
                    <h3 className="ab-value-title">{fa ? v.titleFa : v.titleEn}</h3>
                    <p className="ab-value-desc">{fa ? v.descFa : v.descEn}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="ab-mission-section">
          <div className="ab-container">
            <div className="ab-mission">
              <h2 className="ab-section-title">
                {fa ? "مأموریت ما" : "Our Mission"}
              </h2>
              <p className="ab-mission-text">
                {fa
                  ? "هدف ما ساده است: تأمین مصالح ساختمانی با کیفیت بالا، قیمت منصفانه و تحویل به موقع برای هر پروژه‌ای در هر نقطه‌ای از ایران. باور داریم که زیرساخت قوی کشور با دسترسی آسان به مواد اولیه باکیفیت آغاز می‌شود."
                  : "Our goal is straightforward: supply high-quality construction materials at fair prices with timely delivery for every project, anywhere in Iran. We believe a strong national infrastructure starts with easy access to quality raw materials."}
              </p>
              <Link href="/contact" className="ab-cta">
                {fa ? "با ما تماس بگیرید" : "Get in touch"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .ab-root { background-color: var(--color-background); }
        .ab-container { max-width: 72rem; margin-inline: auto; padding-inline: 1.5rem; }

        /* Hero */
        .ab-hero {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding: 5rem 1.5rem;
          text-align: center;
        }
        .ab-hero-inner { max-width: 48rem; margin-inline: auto; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
        .ab-hero-icon-wrap {
          width: 4rem; height: 4rem; border-radius: var(--radius-xl);
          background-color: var(--color-accent-subtle);
          display: flex; align-items: center; justify-content: center;
        }
        .ab-hero-icon { width: 2rem; height: 2rem; color: var(--color-accent); }
        .ab-hero-title {
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: 700; color: var(--color-text);
          text-wrap: balance;
        }
        .ab-hero-desc {
          font-size: 1rem; line-height: 1.8; color: var(--color-text-secondary);
          text-align: center; max-width: 44rem;
        }

        /* Stats */
        .ab-stats-section { padding: 3rem 1.5rem; }
        .ab-stats {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
        }
        @media (min-width: 768px) { .ab-stats { grid-template-columns: repeat(4, 1fr); } }
        .ab-stat {
          display: flex; flex-direction: column; align-items: center; gap: 0.375rem;
          padding: 1.5rem; background-color: var(--color-surface);
          border: 1px solid var(--color-border); border-radius: var(--radius-lg);
          text-align: center;
        }
        .ab-stat-value {
          font-size: 2rem; font-weight: 700; color: var(--color-accent);
          font-variant-numeric: tabular-nums; direction: ltr;
        }
        .ab-stat-label { font-size: 0.875rem; color: var(--color-text-secondary); }

        /* Values */
        .ab-values-section { padding: 3rem 1.5rem; }
        .ab-section-title {
          font-size: 1.5rem; font-weight: 700; color: var(--color-text);
          margin-bottom: 2rem; text-wrap: balance;
        }
        .ab-values {
          display: grid; grid-template-columns: 1fr; gap: 1.25rem;
        }
        @media (min-width: 640px) { .ab-values { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .ab-values { grid-template-columns: repeat(4, 1fr); } }
        .ab-value-card {
          display: flex; flex-direction: column; gap: 0.75rem;
          padding: 1.5rem; background-color: var(--color-surface);
          border: 1px solid var(--color-border); border-radius: var(--radius-lg);
        }
        .ab-value-icon-wrap {
          width: 2.75rem; height: 2.75rem; border-radius: var(--radius-md);
          background-color: var(--color-accent-subtle);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ab-value-icon { width: 1.375rem; height: 1.375rem; color: var(--color-accent); }
        .ab-value-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }
        .ab-value-desc { font-size: 0.875rem; line-height: 1.7; color: var(--color-text-secondary); }

        /* Mission */
        .ab-mission-section {
          padding: 3rem 1.5rem 5rem;
        }
        .ab-mission {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border); border-radius: var(--radius-xl);
          padding: 2.5rem; max-width: 56rem; margin-inline: auto;
          display: flex; flex-direction: column; gap: 1.25rem;
        }
        .ab-mission-text { font-size: 1rem; line-height: 1.8; color: var(--color-text-secondary); }
        .ab-cta {
          display: inline-flex; align-self: flex-start;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.9375rem; font-weight: 600; padding: 0.625rem 1.5rem;
          border-radius: var(--radius-md); text-decoration: none;
          transition: background-color var(--transition-fast);
        }
        .ab-cta:hover { background-color: var(--color-accent-hover); }
        .ab-cta:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
      `}</style>
    </>
  )
}
