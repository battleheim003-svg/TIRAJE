import Link from "next/link"
import { getLocale } from "next-intl/server"
import { Package, Phone, Mail, MapPin } from "lucide-react"
import { SITE_CONFIG } from "@/config/site"
import styles from "./Footer.module.css"

export async function Footer() {
  const locale = await getLocale()
  const fa = locale === "fa"
  const currentYear = new Date().getFullYear()

  const productLinks = [
    { href: `/${locale}/products?category=cement`, label: fa ? "سیمان" : "Cement" },
    { href: `/${locale}/products?category=aggregate`, label: fa ? "شن و ماسه" : "Sand & Gravel" },
    { href: `/${locale}/products?category=block`, label: fa ? "بلوک و آجر" : "Blocks & Bricks" },
    { href: `/${locale}/products?category=steel`, label: fa ? "آهن‌آلات" : "Steel & Rebar" },
  ]

  const serviceLinks = [
    { href: `/${locale}/freight`, label: fa ? "محاسبه هزینه حمل" : "Freight Calculator" },
    { href: `/${locale}/quote`, label: fa ? "درخواست قیمت" : "Request Quote" },
    { href: `/${locale}/about`, label: fa ? "درباره ما" : "About Us" },
    { href: `/${locale}/contact`, label: fa ? "تماس با ما" : "Contact Us" },
    { href: `/${locale}/blog`, label: fa ? "مجله تیراژه" : "Tirajeh Blog" },
  ]

  const legalLinks = [
    { href: `/${locale}/privacy`, label: fa ? "حریم خصوصی" : "Privacy Policy" },
    { href: `/${locale}/terms`, label: fa ? "قوانین و مقررات" : "Terms & Conditions" },
    { href: `/${locale}/faq`, label: fa ? "سؤالات متداول" : "FAQ" },
  ]

  return (
    <footer className={styles["web-ftr"]}>
      <div className={styles["web-ftr__inner"]}>
        <div className={styles["web-ftr__grid"]}>
          {/* Brand */}
          <div className={styles["web-ftr__brand"]}>
            <Link href={`/${locale}`} className={styles["web-ftr__logo"]}>
              <Package
                style={{ width: "1.5rem", height: "1.5rem" }}
                aria-hidden="true"
              />
              <span className={styles["web-ftr__logo-text"]}>
                {fa ? SITE_CONFIG.brandName.fa : SITE_CONFIG.brandName.en}
              </span>
            </Link>
            <p className={styles["web-ftr__tagline"]}>
              {fa
                ? "مرجع تخصصی خرید سیمان و مصالح ساختمانی از بهترین کارخانه‌های ایران با قیمت مستقیم و تحویل سراسری"
                : "The premier platform for sourcing cement and building materials directly from top manufacturers across Iran."}
            </p>
            <div className={styles["web-ftr__contact"]}>
              <a href={`tel:${SITE_CONFIG.phone.raw}`} className={styles["web-ftr__contact-item"]} dir="ltr">
                <Phone
                  style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span>{fa ? SITE_CONFIG.phone.fa : SITE_CONFIG.phone.raw}</span>
              </a>
              <a href={`tel:${SITE_CONFIG.mobile.raw}`} className={styles["web-ftr__contact-item"]} dir="ltr">
                <Phone
                  style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span>{fa ? SITE_CONFIG.mobile.fa : SITE_CONFIG.mobile.raw}</span>
              </a>
              <a href={`mailto:${SITE_CONFIG.email}`} className={styles["web-ftr__contact-item"]} dir="ltr">
                <Mail
                  style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span>{SITE_CONFIG.email}</span>
              </a>
              <span className={styles["web-ftr__contact-item"]}>
                <MapPin
                  className={styles["web-ftr__contact-item--top"]}
                  style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span>{fa ? SITE_CONFIG.address.fa : SITE_CONFIG.address.en}</span>
              </span>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className={styles["web-ftr__col-title"]}>
              {fa ? "محصولات" : "Products"}
            </h3>
            <ul className={styles["web-ftr__links"]} role="list">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles["web-ftr__link"]}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className={styles["web-ftr__col-title"]}>
              {fa ? "خدمات" : "Services"}
            </h3>
            <ul className={styles["web-ftr__links"]} role="list">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles["web-ftr__link"]}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className={styles["web-ftr__col-title"]}>
              {fa ? "راهنما" : "Guide"}
            </h3>
            <ul className={styles["web-ftr__links"]} role="list">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles["web-ftr__link"]}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles["web-ftr__bottom"]}>
          <p className={styles["web-ftr__copy"]}>
            {fa
              ? `© ${currentYear} ${SITE_CONFIG.brandName.fa} — تمامی حقوق محفوظ است`
              : `© ${currentYear} ${SITE_CONFIG.brandName.en} — All rights reserved`}
          </p>
          <p className={styles["web-ftr__copy"]}>
            {fa ? "ساخته‌شده با ❤️ در ایران" : "Crafted with ❤️ in Iran"}
          </p>
        </div>
      </div>
    </footer>
  )
}
