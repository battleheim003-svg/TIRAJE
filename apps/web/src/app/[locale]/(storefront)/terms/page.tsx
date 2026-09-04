import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { SITE_CONFIG } from "@/config/site"

export const metadata: Metadata = {
  title: "شرایط استفاده | تیراژه",
  description: "شرایط و قوانین استفاده از پلتفرم تیراژه",
}

export default async function TermsPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const sections = fa
    ? [
        {
          title: "۱. پذیرش شرایط",
          body: "با استفاده از وب‌سایت و خدمات تیراژه، شما شرایط و مقررات این صفحه را می‌پذیرید. در صورت عدم موافقت با هر بخش از این شرایط، لطفاً از استفاده از خدمات ما خودداری کنید.",
        },
        {
          title: "۲. ثبت‌نام و حساب کاربری",
          body: "برای دسترسی به برخی امکانات، ثبت‌نام الزامی است. شما مسئول حفظ امنیت رمز عبور و تمام فعالیت‌های انجام‌شده با حساب کاربری خود هستید. تیراژه حق لغو حساب‌های کاربری که قوانین را نقض کنند را محفوظ می‌دارد.",
        },
        {
          title: "۳. ثبت و تأیید سفارش",
          body: "ثبت سفارش آنلاین به معنای تأیید قطعی نیست. سفارش پس از بررسی موجودی و اعلام کتبی از سوی تیراژه قطعی می‌شود. قیمت‌ها ممکن است بدون اطلاع قبلی تغییر کنند؛ قیمت نهایی در اعلام تأیید سفارش مشخص می‌شود.",
        },
        {
          title: "۴. پرداخت و صورتحساب",
          body: "پرداخت باید پیش از ارسال کالا انجام شود، مگر برای مشتریانی که قرارداد اعتباری دارند. فاکتور رسمی با مالیات بر ارزش افزوده ۹٪ صادر می‌شود. در صورت لغو سفارش پیش از ارسال، مبلغ ظرف ۷ روز کاری مسترد می‌شود.",
        },
        {
          title: "۵. تحویل کالا",
          body: "مسئولیت تیراژه تا لحظه تحویل کالا به راننده یا تیم حمل است. پس از تحویل و امضای بارنامه توسط گیرنده، هرگونه ادعای خسارت باید ظرف ۲۴ ساعت اعلام شود. تأخیر ناشی از عوامل خارج از کنترل (بلایای طبیعی، اعتصاب) مسئولیت تیراژه نیست.",
        },
        {
          title: "۶. بازگشت و مرجوعی",
          body: "کالا تنها در صورت عدم مطابقت با مشخصات اعلام‌شده یا وجود عیب فنی قابل مرجوع است. درخواست مرجوعی باید حداکثر ۴۸ ساعت پس از تحویل ثبت شود. هزینه حمل مرجوعی در صورت تأیید عیب توسط تیراژه پرداخت می‌شود.",
        },
        {
          title: "۷. مسئولیت‌ها",
          body: "تیراژه برای استفاده نادرست از محصولات، خسارات غیرمستقیم یا تأخیر ناشی از عوامل خارجی مسئولیتی ندارد. سقف مسئولیت تیراژه در هر حال از مبلغ سفارش مربوطه تجاوز نخواهد کرد.",
        },
        {
          title: "۸. مالکیت معنوی",
          body: "تمام محتوای وب‌سایت تیراژه شامل تصاویر، متون و طراحی‌ها متعلق به تیراژه است و استفاده تجاری از آن‌ها بدون اجازه ممنوع است.",
        },
        {
          title: "۹. تغییرات در شرایط",
          body: "تیراژه حق دارد این شرایط را در هر زمان به‌روز کند. تغییرات مهم از طریق ایمیل یا اعلان در سایت اطلاع‌رسانی می‌شوند. ادامه استفاده پس از انتشار تغییرات به منزله پذیرش آن‌هاست.",
        },
        {
          title: "۱۰. حل اختلاف",
          body: "این قرارداد تابع قوانین جمهوری اسلامی ایران است. در صورت بروز اختلاف، ابتدا از طریق مذاکره راه‌حل جستجو می‌شود. در غیر این صورت، دادگاه‌های صلاحیت‌دار تهران صالح به رسیدگی هستند.",
        },
      ]
    : [
        {
          title: "1. Acceptance of Terms",
          body: "By using Tirajeh's website and services, you accept these terms and conditions. If you disagree with any part, please discontinue use of our services.",
        },
        {
          title: "2. Registration & Account",
          body: "Registration is required for certain features. You are responsible for maintaining account security and all activities under your account. Tirajeh reserves the right to terminate accounts that violate these terms.",
        },
        {
          title: "3. Order Placement & Confirmation",
          body: "Placing an order online does not constitute final confirmation. Orders are confirmed after stock verification and written confirmation from Tirajeh. Prices may change without prior notice; the final price is stated in the order confirmation.",
        },
        {
          title: "4. Payment & Invoicing",
          body: "Payment must be made before shipment, except for clients with credit agreements. Official invoices include 9% VAT. Cancelled pre-shipment orders are refunded within 7 business days.",
        },
        {
          title: "5. Delivery",
          body: "Tirajeh's responsibility ends upon handover to the carrier and signing of the bill of lading. Any damage claims must be reported within 24 hours of delivery. Delays due to force majeure are not Tirajeh's liability.",
        },
        {
          title: "6. Returns",
          body: "Returns are accepted only for goods that differ from specifications or have technical defects. Return requests must be filed within 48 hours of delivery. Return shipping costs are covered by Tirajeh when a defect is confirmed.",
        },
        {
          title: "7. Liability",
          body: "Tirajeh is not liable for misuse of products, indirect damages, or delays caused by external factors. Total liability in any case shall not exceed the value of the relevant order.",
        },
        {
          title: "8. Intellectual Property",
          body: "All website content including images, text, and designs belong to Tirajeh. Commercial use without permission is prohibited.",
        },
        {
          title: "9. Changes to Terms",
          body: "Tirajeh may update these terms at any time. Material changes will be communicated via email or site notification. Continued use after publication constitutes acceptance.",
        },
        {
          title: "10. Dispute Resolution",
          body: "This agreement is governed by the laws of the Islamic Republic of Iran. Disputes are first resolved through negotiation; otherwise, competent courts in Tehran have jurisdiction.",
        },
      ]

  return (
    <>
      <div className="tc-hero">
        <div className="tc-container">
          <p className="tc-eyebrow">{fa ? "قوانین" : "Legal"}</p>
          <h1 className="tc-title">{fa ? "شرایط و قوانین استفاده" : "Terms & Conditions"}</h1>
          <p className="tc-meta">
            {fa ? "آخرین به‌روزرسانی: فروردین ۱۴۰۴" : "Last updated: April 2025"}
          </p>
        </div>
      </div>

      <div className="tc-container tc-body">
        <p className="tc-lead">
          {fa
            ? "لطفاً پیش از استفاده از خدمات تیراژه این شرایط را به دقت بخوانید."
            : "Please read these terms carefully before using Tirajeh's services."}
        </p>

        <div className="tc-sections">
          {sections.map((section, i) => (
            <section key={i} className="tc-section">
              <h2 className="tc-section-title">{section.title}</h2>
              <p className="tc-section-body">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="tc-contact">
          {fa
            ? `برای سؤالات با ما تماس بگیرید: `
            : `For questions, contact us: `}
          <a href={`mailto:${SITE_CONFIG.email}`} className="tc-link">
            {SITE_CONFIG.email}
          </a>
        </div>
      </div>

      <style>{`
        .tc-container { max-width: 52rem; margin-inline: auto; padding-inline: 1.5rem; }
        .tc-hero {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding-block: 3rem 2.5rem;
        }
        .tc-eyebrow {
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-accent); margin-bottom: 0.625rem;
        }
        .tc-title {
          font-size: clamp(1.625rem, 4vw, 2.25rem); font-weight: 800;
          color: var(--color-text); letter-spacing: -0.025em; margin-bottom: 0.5rem;
        }
        .tc-meta { font-size: 0.8125rem; color: var(--color-text-muted); }

        .tc-body { padding-block: 2.5rem 4rem; }
        .tc-lead {
          font-size: 1rem; color: var(--color-text-secondary);
          line-height: 1.75; margin-bottom: 2.5rem;
          padding-bottom: 1.75rem; border-bottom: 1px solid var(--color-border-subtle);
        }

        .tc-sections { display: flex; flex-direction: column; gap: 2rem; }
        .tc-section-title {
          font-size: 0.9375rem; font-weight: 700; color: var(--color-text);
          margin-bottom: 0.625rem;
        }
        .tc-section-body { font-size: 0.9375rem; color: var(--color-text-secondary); line-height: 1.8; }

        .tc-contact {
          margin-top: 2.5rem; padding-top: 1.75rem;
          border-top: 1px solid var(--color-border-subtle);
          font-size: 0.9375rem; color: var(--color-text-secondary);
        }
        .tc-link { color: var(--color-accent); font-weight: 600; text-decoration: none; }
        .tc-link:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}
