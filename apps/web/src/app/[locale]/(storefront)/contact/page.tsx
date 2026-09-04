import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { ContactForm } from "./contact-form"

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
      titleFa: "تلفن",
      titleEn: "Phone",
      valueFa: "۰۲۱-۰۰۰۰۰۰۰۰",
      valueEn: "021-00000000",
      href: "tel:+982100000000",
      dir: "ltr" as const,
    },
    {
      icon: Mail,
      titleFa: "ایمیل",
      titleEn: "Email",
      valueFa: "info@tirajeh.ir",
      valueEn: "info@tirajeh.ir",
      href: "mailto:info@tirajeh.ir",
      dir: "ltr" as const,
    },
    {
      icon: MapPin,
      titleFa: "آدرس",
      titleEn: "Address",
      valueFa: "تهران، ایران",
      valueEn: "Tehran, Iran",
      href: null,
      dir: undefined,
    },
    {
      icon: Clock,
      titleFa: "ساعات کاری",
      titleEn: "Working hours",
      valueFa: "شنبه تا پنج‌شنبه — ۸ تا ۱۷",
      valueEn: "Sat–Thu, 08:00–17:00",
      href: null,
      dir: "ltr" as const,
    },
  ]

  return (
    <>
      <main className="ct-root">
        {/* Header */}
        <section className="ct-hero">
          <div className="ct-hero-inner">
            <h1 className="ct-hero-title">{fa ? "تماس با ما" : "Contact us"}</h1>
            <p className="ct-hero-desc">
              {fa
                ? "برای استعلام قیمت، مشاوره محصول یا هر سؤال دیگری، تیم ما آماده پاسخ‌گویی است."
                : "For price inquiries, product advice, or any other question, our team is ready to help."}
            </p>
          </div>
        </section>

        <div className="ct-body">
          <div className="ct-container">
            <div className="ct-layout">
              {/* Contact info */}
              <aside className="ct-info">
                {info.map((item) => {
                  const Icon = item.icon
                  const content = (
                    <>
                      <div className="ct-info-icon-wrap">
                        <Icon className="ct-info-icon" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="ct-info-label">{fa ? item.titleFa : item.titleEn}</p>
                        <p className="ct-info-value" dir={item.dir}>
                          {fa ? item.valueFa : item.valueEn}
                        </p>
                      </div>
                    </>
                  )

                  return item.href ? (
                    <a key={item.titleEn} href={item.href} className="ct-info-item ct-info-item--link">
                      {content}
                    </a>
                  ) : (
                    <div key={item.titleEn} className="ct-info-item">
                      {content}
                    </div>
                  )
                })}
              </aside>

              {/* Form */}
              <div className="ct-form-wrap">
                <h2 className="ct-form-title">{fa ? "پیام بفرستید" : "Send a message"}</h2>
                <ContactForm fa={fa} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .ct-root { background-color: var(--color-background); min-height: 60vh; }
        .ct-hero {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding: 3.5rem 1.5rem;
          text-align: center;
        }
        .ct-hero-inner { max-width: 40rem; margin-inline: auto; }
        .ct-hero-title { font-size: clamp(1.5rem, 3.5vw, 2rem); font-weight: 700; color: var(--color-text); margin-bottom: 0.75rem; }
        .ct-hero-desc { font-size: 1rem; line-height: 1.75; color: var(--color-text-secondary); }
        .ct-body { padding: 3rem 0 5rem; }
        .ct-container { max-width: 72rem; margin-inline: auto; padding-inline: 1.5rem; }
        .ct-layout { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media (min-width: 768px) { .ct-layout { grid-template-columns: 18rem 1fr; align-items: start; } }
        @media (min-width: 1024px) { .ct-layout { grid-template-columns: 22rem 1fr; } }

        /* Info */
        .ct-info { display: flex; flex-direction: column; gap: 0.75rem; }
        .ct-info-item {
          display: flex; align-items: flex-start; gap: 1rem;
          background-color: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-lg); padding: 1.125rem 1.25rem;
          text-decoration: none; color: inherit;
        }
        .ct-info-item--link { transition: border-color var(--transition-fast); }
        .ct-info-item--link:hover { border-color: var(--color-accent); }
        .ct-info-icon-wrap {
          width: 2.25rem; height: 2.25rem; flex-shrink: 0;
          background-color: var(--color-accent-subtle); border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          margin-top: 0.125rem;
        }
        .ct-info-icon { width: 1.125rem; height: 1.125rem; color: var(--color-accent); }
        .ct-info-label { font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.125rem; }
        .ct-info-value { font-size: 0.9375rem; font-weight: 500; color: var(--color-text); }

        /* Form wrapper */
        .ct-form-wrap {
          background-color: var(--color-surface); border: 1px solid var(--color-border);
          border-radius: var(--radius-xl); padding: 2rem;
        }
        .ct-form-title { font-size: 1.125rem; font-weight: 700; color: var(--color-text); margin-bottom: 1.5rem; }

        /* Form fields */
        .cf-form { display: flex; flex-direction: column; gap: 1.125rem; }
        .cf-row { display: grid; grid-template-columns: 1fr; gap: 1.125rem; }
        @media (min-width: 640px) { .cf-row { grid-template-columns: 1fr 1fr; } }
        .cf-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .cf-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text); }
        .cf-required { color: var(--color-danger); }
        .cf-optional { font-size: 0.75rem; font-weight: 400; color: var(--color-text-muted); }
        .cf-input, .cf-textarea {
          width: 100%; padding: 0.5625rem 0.875rem;
          background-color: var(--color-background);
          border: 1px solid var(--color-border); border-radius: var(--radius-md);
          font-size: 0.9375rem; font-family: inherit; color: var(--color-text);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
          outline: none;
        }
        .cf-input:focus, .cf-textarea:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
        }
        .cf-input--error { border-color: var(--color-danger); }
        .cf-textarea { resize: vertical; min-height: 8rem; }
        .cf-field-error { font-size: 0.75rem; color: var(--color-danger); }
        .cf-submit {
          align-self: flex-start; display: inline-flex; align-items: center; justify-content: center;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.9375rem; font-weight: 600; font-family: inherit;
          padding: 0.625rem 1.75rem; border: none; border-radius: var(--radius-md);
          cursor: pointer; transition: background-color var(--transition-fast), opacity var(--transition-fast);
        }
        .cf-submit:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .cf-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .cf-submit:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .cf-error-banner {
          padding: 0.75rem 1rem; background-color: var(--color-danger-subtle);
          color: var(--color-danger); border-radius: var(--radius-md);
          font-size: 0.875rem;
        }
        .cf-success {
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
          padding: 3rem 1rem; text-align: center;
        }
        .cf-success-title { font-size: 1.125rem; font-weight: 700; color: var(--color-success); }
        .cf-success-sub { font-size: 0.9375rem; color: var(--color-text-secondary); }
        .cf-reset-btn {
          background: none; border: 1px solid var(--color-border); cursor: pointer;
          font-size: 0.875rem; font-family: inherit; color: var(--color-accent);
          padding: 0.5rem 1.25rem; border-radius: var(--radius-md); margin-top: 0.5rem;
          transition: border-color var(--transition-fast);
        }
        .cf-reset-btn:hover { border-color: var(--color-accent); }
      `}</style>
    </>
  )
}
