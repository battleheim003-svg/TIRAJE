import Link from "next/link"
import { getLocale } from "next-intl/server"
import { Package, Phone, Mail, MapPin } from "lucide-react"

export async function Footer() {
  const locale = await getLocale()
  const currentYear = new Date().getFullYear()

  const productLinks = [
    { href: `/${locale}/products?category=cement`, label: "سیمان" },
    { href: `/${locale}/products?category=aggregate`, label: "شن و ماسه" },
    { href: `/${locale}/products?category=block`, label: "بلوک و آجر" },
    { href: `/${locale}/products?category=steel`, label: "آهن‌آلات" },
  ]

  const serviceLinks = [
    { href: `/${locale}/freight`, label: "محاسبه هزینه حمل" },
    { href: `/${locale}/quote`, label: "درخواست قیمت" },
    { href: `/${locale}/about`, label: "درباره ما" },
    { href: `/${locale}/contact`, label: "تماس با ما" },
    { href: `/${locale}/blog`, label: "مجله تیراژه" },
  ]

  const legalLinks = [
    { href: `/${locale}/privacy`, label: "حریم خصوصی" },
    { href: `/${locale}/terms`, label: "قوانین و مقررات" },
    { href: `/${locale}/faq`, label: "سؤالات متداول" },
  ]

  return (
    <>
      <footer className="ft-root">
        <div className="ft-inner">
          <div className="ft-grid">
            {/* Brand */}
            <div className="ft-brand">
              <Link href={`/${locale}`} className="ft-logo">
                <Package className="ft-logo-icon" aria-hidden="true" />
                <span className="ft-logo-text">تیراژه</span>
              </Link>
              <p className="ft-tagline">
                مرجع تخصصی خرید سیمان و مصالح ساختمانی از بهترین کارخانه‌های ایران
                با قیمت مستقیم و تحویل سراسری
              </p>
              <div className="ft-contact">
                <a href="tel:+982100000000" className="ft-contact-item" dir="ltr">
                  <Phone className="ft-contact-icon" aria-hidden="true" />
                  <span>۰۲۱-۰۰۰۰۰۰۰۰</span>
                </a>
                <a href="mailto:info@tirajeh.ir" className="ft-contact-item" dir="ltr">
                  <Mail className="ft-contact-icon" aria-hidden="true" />
                  <span>info@tirajeh.ir</span>
                </a>
                <span className="ft-contact-item">
                  <MapPin className="ft-contact-icon ft-contact-icon--top" aria-hidden="true" />
                  <span>تهران، ایران</span>
                </span>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="ft-col-title">محصولات</h3>
              <ul className="ft-links" role="list">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="ft-link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="ft-col-title">خدمات</h3>
              <ul className="ft-links" role="list">
                {serviceLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="ft-link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="ft-col-title">راهنما</h3>
              <ul className="ft-links" role="list">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="ft-link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ft-bottom">
            <p className="ft-copy">© {currentYear} تیراژه — تمامی حقوق محفوظ است</p>
            <p className="ft-copy">ساخته‌شده با ❤️ در ایران</p>
          </div>
        </div>
      </footer>

      <style>{`
        .ft-root {
          border-top: 1px solid var(--color-border);
          background-color: var(--color-surface);
        }
        .ft-inner {
          max-width: 80rem; margin-inline: auto;
          padding: 3rem 1rem;
        }
        .ft-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        @media (min-width: 640px) {
          .ft-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .ft-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
        }
        .ft-brand { display: flex; flex-direction: column; gap: 0.75rem; }
        .ft-logo {
          display: inline-flex; align-items: center; gap: 0.5rem;
          color: var(--color-accent); text-decoration: none; width: fit-content;
        }
        .ft-logo:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: var(--radius-sm); }
        .ft-logo-icon { width: 1.5rem; height: 1.5rem; }
        .ft-logo-text { font-size: 1.125rem; font-weight: 700; }
        .ft-tagline { font-size: 0.875rem; line-height: 1.75; color: var(--color-text-muted); }
        .ft-contact { display: flex; flex-direction: column; gap: 0.5rem; }
        .ft-contact-item {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; color: var(--color-text-secondary); text-decoration: none;
          transition: color var(--transition-fast);
        }
        a.ft-contact-item:hover { color: var(--color-accent); }
        .ft-contact-icon { width: 1rem; height: 1rem; flex-shrink: 0; }
        .ft-contact-icon--top { align-self: flex-start; margin-top: 0.125rem; }
        .ft-col-title { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
        .ft-links { display: flex; flex-direction: column; gap: 0.625rem; margin-top: 1rem; padding: 0; list-style: none; }
        .ft-link {
          font-size: 0.875rem; color: var(--color-text-secondary); text-decoration: none;
          transition: color var(--transition-fast);
        }
        .ft-link:hover { color: var(--color-accent); }
        .ft-bottom {
          display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 1rem;
          margin-top: 2.5rem; padding-top: 1.5rem;
          border-top: 1px solid var(--color-border-subtle);
        }
        @media (min-width: 640px) { .ft-bottom { flex-direction: row; } }
        .ft-copy { font-size: 0.75rem; color: var(--color-text-muted); }
      `}</style>
    </>
  )
}
