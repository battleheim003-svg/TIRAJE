/**
 * React Email templates.
 * Each export is a React component that renders an HTML email.
 * Used by EmailService via Resend's render() function.
 */
import * as React from "react"
import { formatToman } from "@tirajeh/shared"

// ─── Order Confirmation ───────────────────────────────────────────────────────

interface OrderConfirmProps {
  orderNumber: string
  recipientName: string
  totalAmount: number
  itemCount: number
  estimatedDays: string
  trackingUrl: string
}

export function OrderConfirmEmail(props: OrderConfirmProps) {
  const toman = formatToman(props.totalAmount, "fa")
  return (
    <html dir="rtl" lang="fa">
      <head>
        <meta charSet="utf-8" />
        <title>تأیید سفارش {props.orderNumber}</title>
      </head>
      <body style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif", background: "#F6F5F1", margin: 0 }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: 560, margin: "32px auto" }}>
          <tr>
            <td style={{ background: "#2D6A4F", padding: "24px 32px", borderRadius: "10px 10px 0 0" }}>
              <p style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 700 }}>تیراژه</p>
              <p style={{ color: "#B7E4C7", margin: "4px 0 0", fontSize: 13 }}>سیمان و مصالح ساختمانی</p>
            </td>
          </tr>
          <tr>
            <td style={{ background: "#fff", padding: "32px", borderRadius: "0 0 10px 10px" }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1C20", margin: "0 0 8px" }}>
                سفارش شما ثبت شد ✓
              </h1>
              <p style={{ color: "#5A6170", fontSize: 14, lineHeight: 1.7 }}>
                {props.recipientName} عزیز، سفارش <strong style={{ color: "#1A1C20" }}>{props.orderNumber}</strong> با موفقیت ثبت شد.
              </p>

              <table width="100%" style={{ borderCollapse: "collapse", margin: "24px 0" }}>
                <tr>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #E4E2DC", color: "#5A6170", fontSize: 13 }}>تعداد اقلام</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #E4E2DC", color: "#1A1C20", fontSize: 13, textAlign: "left" }}>{props.itemCount} قلم</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #E4E2DC", color: "#5A6170", fontSize: 13 }}>مبلغ کل</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #E4E2DC", color: "#1A1C20", fontSize: 13, textAlign: "left", fontWeight: 600 }}>{toman}</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", color: "#5A6170", fontSize: 13 }}>زمان تحویل تقریبی</td>
                  <td style={{ padding: "10px 0", color: "#1A1C20", fontSize: 13, textAlign: "left" }}>{props.estimatedDays}</td>
                </tr>
              </table>

              <a
                href={props.trackingUrl}
                style={{
                  display: "inline-block",
                  background: "#2D6A4F",
                  color: "#fff",
                  padding: "12px 28px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                پیگیری سفارش →
              </a>

              <p style={{ color: "#8A919E", fontSize: 12, marginTop: 32 }}>
                سؤال دارید؟ با ما تماس بگیرید: info@tirajeh.ir
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

// ─── Quote Response ───────────────────────────────────────────────────────────

interface QuoteResponseProps {
  recipientName: string
  productName: string
  quantityTon: number
  quotedPrice: number | null
  status: "QUOTED" | "REJECTED"
  adminNote: string | null
  expiresAt: Date | null
}

export function QuoteResponseEmail(props: QuoteResponseProps) {
  const toman = props.quotedPrice
    ? formatToman(props.quotedPrice, "fa")
    : null

  return (
    <html dir="rtl" lang="fa">
      <head><meta charSet="utf-8" /><title>پاسخ استعلام قیمت</title></head>
      <body style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif", background: "#F6F5F1", margin: 0 }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: 560, margin: "32px auto" }}>
          <tr>
            <td style={{ background: "#2D6A4F", padding: "24px 32px", borderRadius: "10px 10px 0 0" }}>
              <p style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 700 }}>پاسخ استعلام قیمت</p>
              <p style={{ color: "#B7E4C7", margin: "4px 0 0", fontSize: 13 }}>شرکت سیمان و مصالح تیراژه</p>
            </td>
          </tr>
          <tr>
            <td style={{ background: "#fff", padding: "32px", borderRadius: "0 0 10px 10px", border: "1px solid #E4E2DC", borderTop: "none" }}>
              <p style={{ color: "#1A1C20", fontSize: 15, margin: "0 0 16px" }}>
                سلام {props.recipientName} عزیز،
              </p>

              {props.quotedPrice ? (
                <>
                  <p style={{ color: "#1A1C20", fontSize: 14 }}>
                    استعلام شما برای <strong>{props.productName}</strong> ({props.quantityTon} تن) بررسی شد.
                  </p>
                  <div style={{ background: "#EAF3EE", border: "1px solid #2D6A4F", borderRadius: 8, padding: "16px 20px", margin: "20px 0" }}>
                    <p style={{ margin: 0, color: "#1A5C38", fontWeight: 700, fontSize: 18 }}>{toman}</p>
                    <p style={{ margin: "4px 0 0", color: "#5A6170", fontSize: 12 }}>قیمت پیشنهادی (هر تن)</p>
                  </div>
                  {props.expiresAt && (
                    <p style={{ color: "#8A919E", fontSize: 12 }}>
                      این قیمت تا {new Date(props.expiresAt).toLocaleDateString("fa-IR")} معتبر است.
                    </p>
                  )}
                </>
              ) : (
                <p style={{ color: "#5A6170", fontSize: 14 }}>
                  متأسفانه در حال حاضر قادر به پاسخگویی به استعلام شما نیستیم.
                </p>
              )}

              {props.adminNote && (
                <p style={{ background: "#F6F5F1", borderRadius: 6, padding: "12px 16px", fontSize: 13, color: "#4A5060" }}>
                  {props.adminNote}
                </p>
              )}
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

// ─── Welcome / Registration ───────────────────────────────────────────────────

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <html dir="rtl" lang="fa">
      <head><meta charSet="utf-8" /><title>خوش آمدید به تیراژه</title></head>
      <body style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif", background: "#F6F5F1", margin: 0 }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: 560, margin: "32px auto", background: "#fff", borderRadius: 10 }}>
          <tr>
            <td style={{ padding: "40px 32px", textAlign: "center" }}>
              <h1 style={{ color: "#2D6A4F", fontSize: 24, margin: "0 0 16px" }}>خوش آمدید! 🎉</h1>
              <p style={{ color: "#5A6170", fontSize: 14, lineHeight: 1.8, maxWidth: 400, margin: "0 auto" }}>
                {name} عزیز، ثبت‌نام شما در تیراژه با موفقیت انجام شد. اکنون می‌توانید از میان بهترین سیمان‌ها و مصالح ساختمانی ایران خرید کنید.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
