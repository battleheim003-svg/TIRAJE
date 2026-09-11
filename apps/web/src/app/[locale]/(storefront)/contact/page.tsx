import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { ContactForm } from "./contact-form"
import styles from "./Contact.module.css"

export const metadata: Metadata = {
  title: "تماس با ما | تیراژه",
  description: "با تیم تیراژه در تماس باشید — مشاوره تخصصی، استعلام قیمت و پشتیبانی سفارش",
}

export default async function ContactPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const info = [
    {
      icon: Phone,
      titleFa: "شماره تلفن تماس",
      titleEn: "Phone Number",
      valueFa: "۰۲۱-۸۸۸۸۰۰۰۰",
      valueEn: "021-88880000",
      href: "tel:+982188880000",
    },
    {
      icon: Mail,
      titleFa: "پست الکترونیک",
      titleEn: "Email Address",
      valueFa: "info@tirajeh.ir",
      valueEn: "info@tirajeh.ir",
      href: "mailto:info@tirajeh.ir",
    },
    {
      icon: MapPin,
      titleFa: "دفتر مرکزی",
      titleEn: "Headquarters",
      valueFa: "تهران، خیابان ولیعصر، برج تجاری تیراژه",
      valueEn: "Tehran, Valiasr St, Tirajeh Tower",
      href: null,
    },
    {
      icon: Clock,
      titleFa: "ساعات پاسخگویی",
      titleEn: "Working Hours",
      valueFa: "شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰ — پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰",
      valueEn: "Sat–Wed 08:00–17:00, Thu 08:00–13:00",
      href: null,
    },
  ]

  return (
    <main className={styles["web-con__root"]}>
      {/* Hero Header */}
      <section className={styles["web-con__hero"]}>
        <div className={styles["web-con__hero-inner"]}>
          <h1 className={styles["web-con__hero-title"]}>
            {fa ? "ارتباط و تماس با ما" : "Contact & Support"}
          </h1>
          <p className={styles["web-con__hero-desc"]}>
            {fa
              ? "برای استعلام قیمت عمده، مشاوره مهندسی سازه یا پیگیری سفارش، تیم پشتیبانی تیراژه در خدمت شماست."
              : "For bulk pricing inquiries, engineering advice, or order tracking, our team is ready to assist you."}
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className={styles["web-con__container"]}>
        <div className={styles["web-con__layout"]}>
          {/* Contact Info Column */}
          <aside className={styles["web-con__info-col"]}>
            {info.map((item) => {
              const Icon = item.icon
              const content = (
                <>
                  <div className={styles["web-con__info-icon-wrap"]}>
                    <Icon
                      style={{ width: "1.25rem", height: "1.25rem" }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className={styles["web-con__info-text"]}>
                    <span className={styles["web-con__info-label"]}>
                      {fa ? item.titleFa : item.titleEn}
                    </span>
                    <span className={styles["web-con__info-val"]}>
                      {fa ? item.valueFa : item.valueEn}
                    </span>
                  </div>
                </>
              )

              return item.href ? (
                <a
                  key={item.titleEn}
                  href={item.href}
                  className={[
                    styles["web-con__info-item"],
                    styles["web-con__info-item--link"],
                  ].join(" ")}
                >
                  {content}
                </a>
              ) : (
                <div key={item.titleEn} className={styles["web-con__info-item"]}>
                  {content}
                </div>
              )
            })}

            {/* Map Placeholder */}
            <div className={styles["web-con__map-placeholder"]}>
              <span>{fa ? "نقشه موقعیت جغرافیایی و انبار مرکزی" : "Office & Warehouse Map Location"}</span>
            </div>
          </aside>

          {/* Form Column */}
          <ContactForm locale={locale} />
        </div>
      </div>
    </main>
  )
}
