import * as React from "react"

export interface OrderStatusEmailProps {
  customerName: string
  customerEmail: string
  orderNumber: string
  newStatus: string
  note?: string
}

export const STATUS_FA: Record<string, string> = {
  CONFIRMED: "تأیید شد",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شد",
  DELIVERED: "تحویل داده شد",
  CANCELLED: "لغو شد",
  REFUNDED: "مبلغ بازگشت داده شد",
}

export function OrderStatusEmail({
  customerName,
  orderNumber,
  newStatus,
  note,
}: OrderStatusEmailProps) {
  const statusText = STATUS_FA[newStatus] ?? newStatus
  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", color: "#1f2937", lineHeight: "1.6" }}>
      <h2 style={{ color: "#111827", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>
        به‌روزرسانی وضعیت سفارش #{orderNumber}
      </h2>
      <p>سلام <strong>{customerName}</strong> عزیز،</p>
      <p>
        وضعیت سفارش شما به <strong>«{statusText}»</strong> تغییر یافت.
      </p>
      {note && (
        <div style={{ backgroundColor: "#f9fafb", padding: "1rem", borderRadius: "8px", margin: "1rem 0" }}>
          <p style={{ margin: "0 0 0.25rem", color: "#6b7280" }}>توضیحات:</p>
          <p style={{ margin: 0 }}>{note}</p>
        </div>
      )}
      <hr style={{ borderColor: "#e5e7eb", margin: "1.5rem 0" }} />
      <p style={{ fontSize: "0.875rem", color: "#9ca3af", textAlign: "center" }}>
        تیراژه — همراه مطمئن پروژه‌های ساختمانی شما
      </p>
    </div>
  )
}
