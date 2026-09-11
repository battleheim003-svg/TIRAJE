import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import Link from "next/link"
import { Package, Target, Users, Truck, ShieldCheck } from "lucide-react"
import styles from "./About.module.css"

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
    <main className={styles["web-about__root"]}>
      {/* Hero */}
      <section className={styles["web-about__hero"]}>
        <div className={styles["web-about__heroInner"]}>
          <div className={styles["web-about__heroIconWrap"]}>
            <Package style={{ width: "2rem", height: "2rem" }} aria-hidden="true" />
          </div>
          <h1 className={styles["web-about__heroTitle"]}>
            {fa ? "تیراژه — مرجع مصالح ساختمانی" : "Tirajeh — Construction Materials Hub"}
          </h1>
          <p className={styles["web-about__heroDesc"]}>
            {fa
              ? "از سال ۱۳۹۳، تیراژه پل ارتباطی میان کارخانه‌های بزرگ تولیدی و خریداران سراسر ایران بوده است. ما با حذف واسطه‌ها و ایجاد شفافیت قیمتی، خرید مصالح ساختمانی را آسان‌تر، سریع‌تر و مقرون‌به‌صرفه‌تر می‌کنیم."
              : "Since 2014, Tirajeh has bridged major production factories and buyers across Iran. By removing intermediaries and creating price transparency, we make purchasing construction materials easier, faster, and more cost-effective."}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className={styles["web-about__statsSection"]}>
        <div className={styles["web-about__container"]}>
          <div className={styles["web-about__stats"]}>
            {stats.map((s) => (
              <div key={s.valueEn} className={styles["web-about__stat"]}>
                <span className={styles["web-about__statValue"]}>{s.valueEn}</span>
                <span className={styles["web-about__statLabel"]}>{fa ? s.labelFa : s.labelEn}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={styles["web-about__valuesSection"]}>
        <div className={styles["web-about__container"]}>
          <h2 className={styles["web-about__sectionTitle"]}>{fa ? "چرا تیراژه؟" : "Why Tirajeh?"}</h2>
          <div className={styles["web-about__values"]}>
            {values.map((v) => {
              const Icon = v.icon
              return (
                <div key={v.titleEn} className={styles["web-about__valueCard"]}>
                  <div className={styles["web-about__valueIconWrap"]}>
                    <Icon style={{ width: "1.375rem", height: "1.375rem" }} aria-hidden="true" />
                  </div>
                  <h3 className={styles["web-about__valueTitle"]}>{fa ? v.titleFa : v.titleEn}</h3>
                  <p className={styles["web-about__valueDesc"]}>{fa ? v.descFa : v.descEn}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={styles["web-about__missionSection"]}>
        <div className={styles["web-about__container"]}>
          <div className={styles["web-about__mission"]}>
            <h2 className={styles["web-about__sectionTitle"]}>
              {fa ? "مأموریت ما" : "Our Mission"}
            </h2>
            <p className={styles["web-about__missionText"]}>
              {fa
                ? "هدف ما ساده است: تأمین مصالح ساختمانی با کیفیت بالا، قیمت منصفانه و تحویل به موقع برای هر پروژه‌ای در هر نقطه‌ای از ایران. باور داریم که زیرساخت قوی کشور با دسترسی آسان به مواد اولیه باکیفیت آغاز می‌شود."
                : "Our goal is straightforward: supply high-quality construction materials at fair prices with timely delivery for every project, anywhere in Iran. We believe a strong national infrastructure starts with easy access to quality raw materials."}
            </p>
            <Link href="/contact" className={styles["web-about__cta"]}>
              {fa ? "با ما تماس بگیرید" : "Get in touch"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
