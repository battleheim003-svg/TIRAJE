import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { SITE_CONFIG } from "@/config/site"
import { ContactForm } from "./contact-form"
import styles from "./Contact.module.css"

export const metadata: Metadata = {
  title: "تماس با ما | تیراژه صنعت خاک",
  description: "با تیم تیراژه صنعت خاک در تماس باشید — مشاوره تخصصی، استعلام قیمت و پشتیبانی سفارش",
}

export default async function ContactPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const info = [
    {
      icon: Phone,
      titleFa: "شماره تلفن تماس",
      titleEn: "Phone Number",
      valueFa: SITE_CONFIG.phone.fa,
      valueEn: SITE_CONFIG.phone.raw,
      href: `tel:${SITE_CONFIG.phone.raw}`,
    },
    {
      icon: Phone,
      titleFa: "تلفن همراه",
      titleEn: "Mobile",
      valueFa: SITE_CONFIG.mobile.fa,
      valueEn: SITE_CONFIG.mobile.raw,
      href: `tel:${SITE_CONFIG.mobile.raw}`,
    },
    {
      icon: Mail,
      titleFa: "پست الکترونیک",
      titleEn: "Email Address",
      valueFa: SITE_CONFIG.email,
      valueEn: SITE_CONFIG.email,
      href: `mailto:${SITE_CONFIG.email}`,
    },
    {
      icon: MapPin,
      titleFa: "دفتر مرکزی",
      titleEn: "Headquarters",
      valueFa: SITE_CONFIG.address.fa,
      valueEn: SITE_CONFIG.address.en,
      href: null,
    },
    {
      icon: Clock,
      titleFa: "ساعات پاسخگویی",
      titleEn: "Working Hours",
      valueFa: SITE_CONFIG.supportHours.fa,
      valueEn: SITE_CONFIG.supportHours.en,
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
