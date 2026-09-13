import * as React from "react"

export interface ContactNoticeEmailProps {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export function ContactNoticeEmail({ name, email, phone, subject, message }: ContactNoticeEmailProps) {
  // React خودش escape میکند — نیازی به escapeHtml نیست
  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h2>پیام تماس جدید</h2>
      <p><strong>نام:</strong> {name}</p>
      <p><strong>ایمیل:</strong> {email}</p>
      <p><strong>تلفن:</strong> {phone}</p>
      <p><strong>موضوع:</strong> {subject}</p>
      <hr />
      <p style={{ whiteSpace: "pre-wrap" }}>{message}</p>
    </div>
  )
}
