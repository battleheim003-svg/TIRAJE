import * as React from "react"
import { formatToman } from "@tirajeh/shared"

export interface OrderConfirmationEmailProps {
  orderNumber: string
  customerName: string
  items: Array<{ nameFa: string; quantity: number; unitPriceToman: number }>
  subtotalToman: number
  shippingToman: number
  totalToman: number
  status: string
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotalToman,
  shippingToman,
  totalToman,
  status,
}: OrderConfirmationEmailProps) {
  return (
    <div dir="rtl" style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", color: "#1f2937", lineHeight: "1.6" }}>
      <h2 style={{ color: "#111827", borderBottom: "2px solid #e5e7eb", paddingBottom: "0.5rem" }}>
        تأیید سفارش #{orderNumber}
      </h2>
      <p>سلام <strong>{customerName}</strong> عزیز،</p>
      <p>سفارش شما با موفقیت ثبت شد و پرداخت آن تأیید گردید.</p>
      
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "1.5rem 0", textAlign: "right" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>محصول</th>
            <th style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>تعداد</th>
            <th style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>قیمت واحد</th>
            <th style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>مجموع</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>{it.nameFa}</td>
              <td style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>{it.quantity}</td>
              <td style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>{formatToman(it.unitPriceToman, "fa")}</td>
              <td style={{ padding: "0.5rem", border: "1px solid #e5e7eb" }}>{formatToman(it.unitPriceToman * it.quantity, "fa")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ backgroundColor: "#f9fafb", padding: "1rem", borderRadius: "8px", margin: "1rem 0" }}>
        <p style={{ margin: "0.25rem 0" }}>مبلغ اقلام: <strong>{formatToman(subtotalToman, "fa")}</strong></p>
        <p style={{ margin: "0.25rem 0" }}>هزینه حمل: <strong>{formatToman(shippingToman, "fa")}</strong></p>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.1rem", borderTop: "1px solid #e5e7eb", paddingTop: "0.5rem" }}>
          مبلغ کل: <strong>{formatToman(totalToman, "fa")}</strong>
        </p>
      </div>

      <p style={{ marginTop: "1.5rem", color: "#4b5563" }}>
        تیم تیراژه با شما تماس خواهد گرفت.
      </p>
      <hr style={{ borderColor: "#e5e7eb", margin: "1.5rem 0" }} />
      <p style={{ fontSize: "0.875rem", color: "#9ca3af", textAlign: "center" }}>
        تیراژه — همراه مطمئن پروژه‌های ساختمانی شما
      </p>
    </div>
  )
}
