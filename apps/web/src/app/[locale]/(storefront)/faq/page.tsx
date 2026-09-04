import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { SITE_CONFIG } from "@/config/site"

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
      <div className="faq-hero">
        <div className="faq-container">
          <p className="faq-eyebrow">{fa ? "راهنما" : "Help"}</p>
          <h1 className="faq-title">{fa ? "سؤالات متداول" : "Frequently Asked Questions"}</h1>
          <p className="faq-sub">
            {fa
              ? "پاسخ سؤالات رایج را اینجا پیدا کنید. نیاز به کمک بیشتر دارید؟"
              : "Find answers to common questions. Need more help?"}
            {" "}
            <a href={`tel:${SITE_CONFIG.phone.raw}`} className="faq-phone-link" dir="ltr">
              {SITE_CONFIG.phone.fa}
            </a>
          </p>
        </div>
      </div>

      <div className="faq-container faq-body">
        <div className="faq-list" role="list">
          {faqs.map((item, i) => (
            <details key={i} className="faq-item" role="listitem">
              <summary className="faq-question">
                <span>{item.q}</span>
                <span className="faq-chevron" aria-hidden="true">▾</span>
              </summary>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="faq-contact-box">
          <p className="faq-contact-title">
            {fa ? "پاسخ سؤال خود را نیافتید؟" : "Didn't find your answer?"}
          </p>
          <p className="faq-contact-sub">
            {fa
              ? "کارشناسان ما آماده پاسخگویی هستند"
              : "Our specialists are ready to help"}
          </p>
          <div className="faq-contact-actions">
            <a
              href={`tel:${SITE_CONFIG.phone.raw}`}
              className="faq-cta faq-cta--primary"
              dir="ltr"
            >
              {SITE_CONFIG.phone.fa}
            </a>
            <a href={`/${locale}/contact`} className="faq-cta faq-cta--outline">
              {fa ? "فرم تماس" : "Contact Form"}
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .faq-container {
          max-width: 52rem;
          margin-inline: auto;
          padding-inline: 1.5rem;
        }
        .faq-hero {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding-block: 3rem 2.5rem;
          text-align: center;
        }
        .faq-eyebrow {
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-accent);
          margin-bottom: 0.75rem;
        }
        .faq-title {
          font-size: clamp(1.625rem, 4vw, 2.25rem);
          font-weight: 800;
          color: var(--color-text);
          letter-spacing: -0.025em;
          margin-bottom: 0.875rem;
        }
        .faq-sub {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .faq-phone-link {
          color: var(--color-accent);
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }
        .faq-phone-link:hover { text-decoration: underline; }

        .faq-body { padding-block: 3rem 4rem; }
        .faq-list { display: flex; flex-direction: column; gap: 0; }

        .faq-item {
          border-bottom: 1px solid var(--color-border-subtle);
        }
        .faq-item:first-child {
          border-top: 1px solid var(--color-border-subtle);
        }

        .faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-block: 1.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--color-text);
          cursor: pointer;
          list-style: none;
          user-select: none;
          transition: color var(--transition-fast);
        }
        .faq-question::-webkit-details-marker { display: none; }
        .faq-question:hover { color: var(--color-accent); }
        .faq-item[open] .faq-question { color: var(--color-accent); }

        .faq-chevron {
          font-size: 1rem;
          flex-shrink: 0;
          transition: transform 0.2s ease;
          color: var(--color-text-muted);
        }
        .faq-item[open] .faq-chevron { transform: rotate(180deg); }

        .faq-answer {
          padding-bottom: 1.25rem;
          padding-inline-end: 2rem;
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.75;
        }

        .faq-contact-box {
          margin-top: 3rem;
          padding: 2rem;
          background-color: var(--color-accent-subtle);
          border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
          border-radius: var(--radius-xl);
          text-align: center;
        }
        .faq-contact-title { font-size: 1.0625rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.375rem; }
        .faq-contact-sub { font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 1.25rem; }
        .faq-contact-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
        .faq-cta {
          display: inline-flex; align-items: center;
          padding: 0.5625rem 1.375rem;
          border-radius: var(--radius-md);
          font-size: 0.9375rem;
          font-weight: 700;
          text-decoration: none;
          transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
        }
        .faq-cta--primary { background-color: var(--color-accent); color: #fff; border: 1.5px solid var(--color-accent); }
        .faq-cta--primary:hover { background-color: var(--color-accent-hover); border-color: var(--color-accent-hover); }
        .faq-cta--outline { background: none; border: 1.5px solid var(--color-accent); color: var(--color-accent); }
        .faq-cta--outline:hover { background-color: var(--color-accent); color: #fff; }
      `}</style>
    </>
  )
}
