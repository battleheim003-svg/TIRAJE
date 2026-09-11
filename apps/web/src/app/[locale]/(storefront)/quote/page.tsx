import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { db } from "@tirajeh/database"
import { QuoteForm } from "./quote-form"
import styles from "./Quote.module.css"

export const metadata: Metadata = {
  title: "درخواست استعلام قیمت عمده | تیراژه",
  description: "درخواست قیمت عمده و پیش‌فاکتور برای سیمان و مصالح ساختمانی از تیراژه",
}

async function getProducts() {
  return db.product.findMany({
    where: { isActive: true },
    select: { id: true, nameFa: true, nameEn: true },
    orderBy: { nameFa: "asc" },
  })
}

export default async function QuotePage() {
  const locale = await getLocale()
  const fa = locale === "fa"
  const products = await getProducts()

  return (
    <div>
      {/* Hero Section */}
      <section className={styles["web-rfq__hero"]}>
        <div className={styles["web-rfq__hero-inner"]}>
          <p className={styles["web-rfq__eyebrow"]}>
            {fa ? "فروش مستقیم کارخانجات" : "Direct Factory Supply"}
          </p>
          <h1 className={styles["web-rfq__title"]}>
            {fa ? "استعلام قیمت عمده و پیش‌فاکتور" : "Request a Bulk Quote"}
          </h1>
          <p className={styles["web-rfq__sub"]}>
            {fa
              ? "فرم زیر را جهت دریافت قیمت رقابتی و شرایط پرداخت پروژه‌ای تکمیل نمایید."
              : "Complete the form below to receive competitive bulk pricing and terms."}
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className={styles["web-rfq__container"]}>
        <div className={styles["web-rfq__layout"]}>
          {/* Main Form */}
          <QuoteForm products={products} locale={locale} />

          {/* Aside Information */}
          <aside className={styles["web-rfq__aside-card"]}>
            <h2 className={styles["web-rfq__aside-title"]}>
              {fa ? "مزایای خرید از تیراژه" : "Why Choose Tirajeh?"}
            </h2>
            <ul className={styles["web-rfq__aside-list"]}>
              {fa ? (
                <>
                  <li>گواهی استاندارد ملی ایران (ISIRI) به همراه برگ آنالیز آزمایشگاهی کارخانه</li>
                  <li>ارسال مستقیم از کارخانه بدون واسطه با بارنامه رسمی دولتی</li>
                  <li>تأمین پایدار در فصول پرتقاضا با اولویت پروژه‌های انبوه‌سازی</li>
                  <li>امکان تسویه اعتباری و ضمانت‌نامه برای پیمانکاران دارای رتبه</li>
                  <li>پشتیبانی تخصصی مهندسی سازه و بتن در انتخاب تیپ سیمان</li>
                </>
              ) : (
                <>
                  <li>ISIRI national standard certified with factory laboratory chemical analyses</li>
                  <li>Direct factory dispatch with official government shipping bills</li>
                  <li>Consistent and reliable supply during peak construction seasons</li>
                  <li>Credit lines and bank guarantee facilities for verified contractors</li>
                  <li>Concrete engineering consultancy for specialized cement grades</li>
                </>
              )}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}
