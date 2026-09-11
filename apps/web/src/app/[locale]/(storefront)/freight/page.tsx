import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { FreightCalcForm } from "./FreightCalcForm"
import styles from "./Freight.module.css"

export const metadata: Metadata = {
  title: "محاسبه آنلاین هزینه حمل و باربری | تیراژه",
  description: "محاسبه دقیق هزینه حمل‌ونقل جاده‌ای سیمان و مصالح ساختمانی به سراسر ایران",
}

export default async function FreightPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  return (
    <div>
      {/* Hero Section */}
      <section className={styles["web-frgt__hero"]}>
        <div className={styles["web-frgt__hero-inner"]}>
          <p className={styles["web-frgt__eyebrow"]}>
            {fa ? "سامانه هوشمند لجستیک" : "Logistics Calculator"}
          </p>
          <h1 className={styles["web-frgt__title"]}>
            {fa ? "محاسبه آنلاین کرایه حمل بار" : "Freight Cost Estimator"}
          </h1>
          <p className={styles["web-frgt__sub"]}>
            {fa
              ? "برآورد سریع نرخ باربری بر اساس تناژ بار، نوع ناوگان و استان مقصد با تعرفه مصوب پایانه."
              : "Quick estimation of road freight costs based on tonnage, truck type and destination."}
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className={styles["web-frgt__container"]}>
        <FreightCalcForm locale={locale} />

        {/* Note Card */}
        <div className={styles["web-frgt__note-card"]}>
          <h3 className={styles["web-frgt__note-title"]}>
            {fa ? "نکات مهم در خصوص ارسال بار و تخلیه" : "Important Transport & Unloading Notes"}
          </h3>
          <ul className={styles["web-frgt__note-list"]}>
            {fa ? (
              <>
                <li>قیمت‌های اعلام‌شده تقریبی بوده و بر مبنای تعرفه روز انجمن صنفی شرکت‌های حمل‌ونقل محاسبه می‌شود.</li>
                <li>تخلیه بار در محل پروژه به عهده خریدار محترم است (مگر در موارد توافق قبلی برای جرثقیل و کارگر).</li>
                <li>برای محموله‌های فله با بونکر، تجهیز بودن کارگاه به سیلوی ذخیره با ظرفیت متناسب الزامی است.</li>
                <li>جهت استعلام نرخ محموله‌های فوق‌سنگین یا تناژهای بیش از ۵۰۰ تن، مستقیماً با بخش لجستیک تماس بگیرید.</li>
              </>
            ) : (
              <>
                <li>Rates are estimates based on standard union transportation tariffs and fuel surcharges.</li>
                <li>On-site cargo discharge is the responsibility of the buyer unless crane services are contracted.</li>
                <li>For bulk pneumatic cement deliveries, compliant on-site storage silos are required.</li>
                <li>For oversized loads or volumes exceeding 500 tons, please contact our logistics desk directly.</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
