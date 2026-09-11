import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { SITE_CONFIG } from "@/config/site"
import styles from "./Faq.module.css"

export const metadata: Metadata = {
  title: "سؤالات متداول | تیراژه",
  description: "پاسخ به سؤالات رایج درباره خرید سیمان و مصالح ساختمانی از تیراژه",
}

const FAQ_FA = [
  {
    q: "حداقل مقدار سفارش چقدر است؟",
    a: "حداقل سفارش برای اغلب محصولات ۵۰۰ کیلوگرم (نیم‌تُن) است. برای محصولات فله‌ای مانند شن و ماسه، حداقل ۱ تُن اعمال می‌شود.",
  },
  {
    q: "آیا قیمت‌ها شامل مالیات بر ارزش افزوده هستند؟",
    a: "خیر، قیمت‌های نمایش‌داده‌شده بدون احتساب مالیات بر ارزش افزوده هستند. مالیات ۹٪ در مرحله صدور فاکتور محاسبه و اضافه می‌شود.",
  },
  {
    q: "زمان تحویل چقدر است؟",
    a: "زمان تحویل بسته به استان مقصد بین ۱ تا ۵ روز کاری است. برای تهران معمولاً ۱ تا ۲ روز و برای استان‌های دور ۳ تا ۵ روز.",
  },
  {
    q: "چگونه می‌توانم مقدار بیشتری سفارش دهم؟",
    a: "برای سفارش‌های عمده بالای ۵۰ تُن، لطفاً با تیم فروش ما از طریق تلفن یا فرم درخواست قیمت ارتباط بگیرید تا شرایط ویژه اعمال شود.",
  },
  {
    q: "آیا امکان پرداخت اقساطی وجود دارد؟",
    a: "بله، برای مشتریان حقوقی و پیمانکاران با قرارداد، شرایط پرداخت ۳۰ تا ۹۰ روزه قابل توافق است. با کارشناسان ما تماس بگیرید.",
  },
  {
    q: "آیا محصولات دارای گواهینامه کیفیت هستند؟",
    a: "تمام محصولات دارای گواهینامه استاندارد ملی ایران (ISIRI) و مدارک آزمایشگاهی کارخانه هستند. مدارک همراه با بارنامه ارسال می‌شوند.",
  },
  {
    q: "روش‌های پرداخت چیست؟",
    a: "پرداخت آنلاین از طریق درگاه بانکی، انتقال بانکی (واریز به حساب)، و برای مشتریان دارای قرارداد، پرداخت اعتباری امکان‌پذیر است.",
  },
  {
    q: "آیا می‌توان سفارش را پس از ثبت تغییر داد؟",
    a: "تا قبل از تأیید نهایی توسط تیم ما (معمولاً ۲ ساعت پس از ثبت)، امکان تغییر یا لغو سفارش وجود دارد. برای تغییر با پشتیبانی تماس بگیرید.",
  },
]

const FAQ_EN = [
  {
    q: "What is the minimum order quantity?",
    a: "The minimum order for most products is 500 kg (half a ton). For bulk materials like sand and gravel, the minimum is 1 ton.",
  },
  {
    q: "Are prices inclusive of VAT?",
    a: "No, displayed prices are exclusive of VAT. A 9% VAT is added at the invoicing stage.",
  },
  {
    q: "What is the delivery time?",
    a: "Delivery time varies by destination province: 1–2 business days for Tehran and 3–5 business days for distant provinces.",
  },
  {
    q: "How can I place a large volume order?",
    a: "For orders over 50 tons, please contact our sales team via phone or the quote request form to receive special bulk pricing.",
  },
  {
    q: "Is installment payment available?",
    a: "Yes, for corporate clients and contractors with a signed contract, payment terms of 30–90 days can be arranged. Contact our team.",
  },
  {
    q: "Do products have quality certificates?",
    a: "All products carry the Iranian National Standard (ISIRI) certificate and laboratory reports from the factory. Documents are sent with the bill of lading.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Online payment via bank gateway, wire transfer, and for contracted clients, deferred credit payments.",
  },
  {
    q: "Can I change my order after placing it?",
    a: "Orders can be changed or cancelled before final confirmation by our team (usually within 2 hours of placement). Contact support to make changes.",
  },
]

export default async function FaqPage() {
  const locale = await getLocale()
  const fa = locale === "fa"
  const faqs = fa ? FAQ_FA : FAQ_EN

  return (
    <>
      <div className={styles["web-faq__hero"]}>
        <div className={styles["web-faq__container"]}>
          <p className={styles["web-faq__eyebrow"]}>{fa ? "راهنما" : "Help"}</p>
          <h1 className={styles["web-faq__title"]}>{fa ? "سؤالات متداول" : "Frequently Asked Questions"}</h1>
          <p className={styles["web-faq__sub"]}>
            {fa
              ? "پاسخ سؤالات رایج را اینجا پیدا کنید. نیاز به کمک بیشتر دارید؟"
              : "Find answers to common questions. Need more help?"}
            {" "}
            <a href={`tel:${SITE_CONFIG.phone.raw}`} className={styles["web-faq__phoneLink"]} dir="ltr">
              {SITE_CONFIG.phone.fa}
            </a>
          </p>
        </div>
      </div>

      <div className={`${styles["web-faq__container"]} ${styles["web-faq__body"]}`}>
        <div className={styles["web-faq__list"]} role="list">
          {faqs.map((item, i) => (
            <details key={i} className={styles["web-faq__item"]} role="listitem">
              <summary className={styles["web-faq__question"]}>
                <span>{item.q}</span>
                <span className={styles["web-faq__chevron"]} aria-hidden="true">▾</span>
              </summary>
              <div className={styles["web-faq__answer"]}>
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className={styles["web-faq__contactBox"]}>
          <p className={styles["web-faq__contactTitle"]}>
            {fa ? "پاسخ سؤال خود را نیافتید؟" : "Didn't find your answer?"}
          </p>
          <p className={styles["web-faq__contactSub"]}>
            {fa
              ? "کارشناسان ما آماده پاسخگویی هستند"
              : "Our specialists are ready to help"}
          </p>
          <div className={styles["web-faq__contactActions"]}>
            <a
              href={`tel:${SITE_CONFIG.phone.raw}`}
              className={`${styles["web-faq__cta"]} ${styles["web-faq__ctaPrimary"]}`}
              dir="ltr"
            >
              {SITE_CONFIG.phone.fa}
            </a>
            <a
              href={`/${locale}/contact`}
              className={`${styles["web-faq__cta"]} ${styles["web-faq__ctaOutline"]}`}
            >
              {fa ? "فرم تماس" : "Contact Form"}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
