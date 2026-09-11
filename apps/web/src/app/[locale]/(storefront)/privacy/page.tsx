import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { SITE_CONFIG } from "@/config/site"
import styles from "./Privacy.module.css"

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
      <div className={styles["web-privacy__hero"]}>
        <div className={styles["web-privacy__container"]}>
          <p className={styles["web-privacy__eyebrow"]}>{fa ? "قوانین" : "Legal"}</p>
          <h1 className={styles["web-privacy__title"]}>{fa ? "سیاست حریم خصوصی" : "Privacy Policy"}</h1>
          <p className={styles["web-privacy__meta"]}>
            {fa ? "آخرین به‌روزرسانی: فروردین ۱۴۰۴" : "Last updated: April 2025"}
          </p>
        </div>
      </div>

      <div className={`${styles["web-privacy__container"]} ${styles["web-privacy__body"]}`}>
        <p className={styles["web-privacy__lead"]}>
          {fa
            ? "تیراژه به حریم خصوصی کاربران خود اهمیت می‌دهد. این سیاست نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شما را توضیح می‌دهد."
            : "Tirajeh values the privacy of its users. This policy explains how we collect, use, and protect your information."}
        </p>

        <div className={styles["web-privacy__sections"]}>
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className={styles["web-privacy__sectionTitle"]}>{section.title}</h2>
              <div className={styles["web-privacy__sectionBody"]}>
                {section.body.split("\n").map((line, j) =>
                  line.startsWith("•") ? (
                    <p key={j} className={styles["web-privacy__bullet"]}>{line}</p>
                  ) : (
                    <p key={j}>{line}</p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className={styles["web-privacy__contact"]}>
          <p>
            {fa
              ? `برای سؤالات مربوط به حریم خصوصی با ما تماس بگیرید: `
              : `For privacy-related questions, contact us: `}
            <a href={`mailto:${SITE_CONFIG.email}`} className={styles["web-privacy__link"]}>
              {SITE_CONFIG.email}
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
