import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { SITE_CONFIG } from "@/config/site"

export const metadata: Metadata = {
  title: "سیاست حریم خصوصی | تیراژه",
  description: "سیاست حریم خصوصی و نحوه استفاده از اطلاعات کاربران در تیراژه",
}

export default async function PrivacyPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const sections = fa
    ? [
        {
          title: "اطلاعاتی که جمع‌آوری می‌کنیم",
          body: `هنگام استفاده از خدمات تیراژه، ممکن است اطلاعات زیر از شما دریافت شود:
• نام، نام خانوادگی و اطلاعات تماس (ایمیل، شماره تلفن)
• آدرس تحویل و کد پستی
• اطلاعات شرکت و کد ملی (برای مشتریان حقوقی)
• تاریخچه سفارشات و تراکنش‌های مالی
• اطلاعات مرورگر و آدرس IP برای بهبود تجربه کاربری`,
        },
        {
          title: "نحوه استفاده از اطلاعات",
          body: `اطلاعات شما برای اهداف زیر استفاده می‌شود:
• پردازش و ارسال سفارشات
• صدور فاکتور رسمی و مدارک مالی
• ارتباط با شما درباره وضعیت سفارش
• بهبود خدمات و تجربه کاربری
• ارسال اخبار و پیشنهادات (با رضایت شما)`,
        },
        {
          title: "اشتراک‌گذاری اطلاعات",
          body: `اطلاعات شخصی شما هرگز بدون اجازه به اشخاص ثالث فروخته نمی‌شود. اطلاعات تنها در موارد زیر با همکاران تجاری ما به اشتراک گذاشته می‌شود:
• شرکت‌های حمل‌ونقل برای تحویل سفارش
• درگاه‌های پرداخت بانکی برای پردازش تراکنش
• الزامات قانونی و قضایی`,
        },
        {
          title: "امنیت اطلاعات",
          body: `تیراژه از پروتکل‌های امنیتی استاندارد صنعتی برای محافظت از اطلاعات شما استفاده می‌کند، از جمله رمزنگاری SSL/TLS برای انتقال داده‌ها و ذخیره‌سازی امن رمزهای عبور. با این حال، هیچ سیستمی ۱۰۰٪ امن نیست و در صورت بروز نقص امنیتی، در اسرع وقت مطلع خواهید شد.`,
        },
        {
          title: "حقوق شما",
          body: `شما حق دارید:
• به اطلاعاتی که از شما داریم دسترسی داشته باشید
• درخواست اصلاح اطلاعات نادرست را بدهید
• درخواست حذف اطلاعات (در حدود الزامات قانونی) را بدهید
• عضویت در خبرنامه را لغو کنید
برای اعمال این حقوق با ما از طریق ${SITE_CONFIG.email} تماس بگیرید.`,
        },
        {
          title: "کوکی‌ها",
          body: `تیراژه از کوکی‌ها برای بهبود تجربه مرور، ذخیره تنظیمات و تحلیل ترافیک سایت استفاده می‌کند. می‌توانید کوکی‌ها را در مرورگر خود غیرفعال کنید، اما برخی امکانات سایت ممکن است محدود شوند.`,
        },
      ]
    : [
        {
          title: "Information We Collect",
          body: `When using Tirajeh services, we may collect:
• Name and contact information (email, phone number)
• Delivery address and postal code
• Company information and national ID (for corporate clients)
• Order history and financial transactions
• Browser information and IP address for UX improvement`,
        },
        {
          title: "How We Use Your Information",
          body: `Your information is used to:
• Process and fulfill orders
• Issue official invoices and financial documents
• Communicate order status updates
• Improve our services and user experience
• Send news and offers (with your consent)`,
        },
        {
          title: "Information Sharing",
          body: `Your personal information is never sold to third parties. Information is shared only with:
• Shipping companies for order delivery
• Payment gateways for transaction processing
• Legal and judicial requirements`,
        },
        {
          title: "Data Security",
          body: `Tirajeh uses industry-standard security protocols including SSL/TLS encryption for data transmission and secure password storage. No system is 100% secure, and in the event of a breach, you will be notified promptly.`,
        },
        {
          title: "Your Rights",
          body: `You have the right to:
• Access the information we hold about you
• Request correction of inaccurate information
• Request deletion of your data (subject to legal requirements)
• Unsubscribe from newsletters
To exercise these rights, contact us at ${SITE_CONFIG.email}.`,
        },
        {
          title: "Cookies",
          body: `Tirajeh uses cookies to improve browsing experience, save preferences, and analyze site traffic. You may disable cookies in your browser, but some features may be limited.`,
        },
      ]

  return (
    <>
      <div className="pp-hero">
        <div className="pp-container">
          <p className="pp-eyebrow">{fa ? "قوانین" : "Legal"}</p>
          <h1 className="pp-title">{fa ? "سیاست حریم خصوصی" : "Privacy Policy"}</h1>
          <p className="pp-meta">
            {fa ? "آخرین به‌روزرسانی: فروردین ۱۴۰۴" : "Last updated: April 2025"}
          </p>
        </div>
      </div>

      <div className="pp-container pp-body">
        <p className="pp-lead">
          {fa
            ? "تیراژه به حریم خصوصی کاربران خود اهمیت می‌دهد. این سیاست نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شما را توضیح می‌دهد."
            : "Tirajeh values the privacy of its users. This policy explains how we collect, use, and protect your information."}
        </p>

        <div className="pp-sections">
          {sections.map((section, i) => (
            <section key={i} className="pp-section">
              <h2 className="pp-section-title">{section.title}</h2>
              <div className="pp-section-body">
                {section.body.split("\n").map((line, j) =>
                  line.startsWith("•") ? (
                    <p key={j} className="pp-bullet">{line}</p>
                  ) : (
                    <p key={j}>{line}</p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="pp-contact">
          <p>
            {fa
              ? `برای سؤالات مربوط به حریم خصوصی با ما تماس بگیرید: `
              : `For privacy-related questions, contact us: `}
            <a href={`mailto:${SITE_CONFIG.email}`} className="pp-link">
              {SITE_CONFIG.email}
            </a>
          </p>
        </div>
      </div>

      <style>{`
        .pp-container { max-width: 52rem; margin-inline: auto; padding-inline: 1.5rem; }
        .pp-hero {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding-block: 3rem 2.5rem;
        }
        .pp-eyebrow {
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-accent); margin-bottom: 0.625rem;
        }
        .pp-title {
          font-size: clamp(1.625rem, 4vw, 2.25rem); font-weight: 800;
          color: var(--color-text); letter-spacing: -0.025em; margin-bottom: 0.5rem;
        }
        .pp-meta { font-size: 0.8125rem; color: var(--color-text-muted); }

        .pp-body { padding-block: 2.5rem 4rem; }
        .pp-lead {
          font-size: 1rem; color: var(--color-text-secondary);
          line-height: 1.75; margin-bottom: 2.5rem;
          padding-bottom: 1.75rem; border-bottom: 1px solid var(--color-border-subtle);
        }

        .pp-sections { display: flex; flex-direction: column; gap: 2.25rem; }
        .pp-section-title {
          font-size: 1.0625rem; font-weight: 700; color: var(--color-text);
          margin-bottom: 0.875rem; padding-inline-start: 0.875rem;
          border-inline-start: 3px solid var(--color-accent);
        }
        .pp-section-body { font-size: 0.9375rem; color: var(--color-text-secondary); line-height: 1.8; }
        .pp-section-body p + p { margin-top: 0.375rem; }
        .pp-bullet { padding-inline-start: 0.25rem; }

        .pp-contact {
          margin-top: 2.5rem; padding-top: 1.75rem;
          border-top: 1px solid var(--color-border-subtle);
          font-size: 0.9375rem; color: var(--color-text-secondary);
        }
        .pp-link { color: var(--color-accent); font-weight: 600; text-decoration: none; }
        .pp-link:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}
