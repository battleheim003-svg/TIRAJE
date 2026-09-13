import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { registerPdfFonts, toJalali } from "@/lib/pdf-utils"
import { formatToman, toFarsiDigits } from "@/lib/cement"

registerPdfFonts()

const styles = StyleSheet.create({
  page: {
    fontFamily: "Vazirmatn",
    padding: 36,
    fontSize: 9,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  headerCompany: {
    textAlign: "right",
    flex: 1,
  },
  headerDoc: {
    textAlign: "left",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  textMuted: {
    color: "#475569",
    fontSize: 8.5,
    marginBottom: 2,
    textAlign: "right",
  },
  infoSection: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoBox: {
    flex: 1,
    textAlign: "right",
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 2,
  },
  infoRow: {
    flexDirection: "row-reverse",
    marginBottom: 3,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 8,
    width: 60,
    textAlign: "right",
  },
  infoValue: {
    color: "#1e293b",
    fontSize: 8,
    flex: 1,
    textAlign: "right",
  },
  table: {
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  tableHeader: {
    flexDirection: "row-reverse",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 5,
    fontWeight: "bold",
    fontSize: 8,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    fontSize: 8,
  },
  colIndex: { width: "6%", textAlign: "center" },
  colName: { width: "38%", textAlign: "right", paddingRight: 6 },
  colQty: { width: "12%", textAlign: "center" },
  colWeight: { width: "12%", textAlign: "center" },
  colUnitPrice: { width: "16%", textAlign: "center" },
  colTotal: { width: "16%", textAlign: "center" },
  summaryContainer: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  summaryBox: {
    width: "45%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    padding: 8,
  },
  summaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryRowTotal: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 7.5,
    color: "#64748b",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
})

export interface InvoiceDocumentProps {
  order: {
    orderNumber: number | string
    createdAt: Date | string
    totalAmount: number
    shippingCost: number | null
    shippingProvince: string | null
    items: Array<{
      productNameFa: string
      quantity: number
      unitPrice: number
      weightKg: number | null
    }>
    user: {
      name: string | null
      phone: string | null
      customerProfile?: {
        companyName?: string | null
        nationalId?: string | null
        economicCode?: string | null
        address?: string | null
      } | null
    }
    shippingAddress?: string | null
  }
  company: {
    name: string
    phone: string
    address: string
    nationalId: string
    economicCode: string
  }
}

export function InvoiceDocument({ order, company }: InvoiceDocumentProps) {
  const jalaliDate = toJalali(order.createdAt)
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const shippingCost = order.shippingCost ?? 0
  const grandTotal = order.totalAmount || subtotal + shippingCost

  const profile = order.user.customerProfile
  const customerName = profile?.companyName || order.user.name || "مشتری محترم"

  return (
    <Document title={`پیش‌فاکتور سفارش #${order.orderNumber}`} author={company.name}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerCompany}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.textMuted}>تلفن تماس: {company.phone}</Text>
            <Text style={styles.textMuted}>نشانی: {company.address}</Text>
            {Boolean(company.nationalId) && (
              <Text style={styles.textMuted}>شناسه ملی: {toFarsiDigits(company.nationalId)}</Text>
            )}
            {Boolean(company.economicCode) && (
              <Text style={styles.textMuted}>کد اقتصادی: {toFarsiDigits(company.economicCode)}</Text>
            )}
          </View>
          <View style={styles.headerDoc}>
            <Text style={styles.title}>پیش‌فاکتور فروش</Text>
            <Text style={styles.textMuted}>شماره: #{toFarsiDigits(order.orderNumber)}</Text>
            <Text style={styles.textMuted}>تاریخ: {jalaliDate}</Text>
            <Text style={styles.textMuted}>اعتبار: ۳ روز کاری از تاریخ صدور</Text>
          </View>
        </View>

        {/* Customer & Invoice Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>مشخصات خریدار</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>نام / شرکت:</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>شماره تماس:</Text>
              <Text style={styles.infoValue}>{order.user.phone ? toFarsiDigits(order.user.phone) : "—"}</Text>
            </View>
            {profile?.nationalId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>شناسه / کدملی:</Text>
                <Text style={styles.infoValue}>{toFarsiDigits(profile.nationalId)}</Text>
              </View>
            )}
            {profile?.economicCode && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>کد اقتصادی:</Text>
                <Text style={styles.infoValue}>{toFarsiDigits(profile.economicCode)}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>نشانی مقصد:</Text>
              <Text style={styles.infoValue}>
                {order.shippingAddress || profile?.address || order.shippingProvince || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colIndex}>ردیف</Text>
            <Text style={styles.colName}>شرح کالا یا خدمات</Text>
            <Text style={styles.colQty}>تعداد (کیسه)</Text>
            <Text style={styles.colWeight}>وزن (تن)</Text>
            <Text style={styles.colUnitPrice}>قیمت واحد</Text>
            <Text style={styles.colTotal}>مبلغ کل</Text>
          </View>

          {order.items.map((item, idx) => {
            const weightTon = ((item.weightKg ?? 0) * item.quantity) / 1000
            const rowTotal = item.quantity * item.unitPrice
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colIndex}>{toFarsiDigits(idx + 1)}</Text>
                <Text style={styles.colName}>{item.productNameFa}</Text>
                <Text style={styles.colQty}>{toFarsiDigits(item.quantity)}</Text>
                <Text style={styles.colWeight}>
                  {weightTon > 0 ? toFarsiDigits(weightTon.toFixed(1)) : "—"}
                </Text>
                <Text style={styles.colUnitPrice}>{formatToman(item.unitPrice, "fa")}</Text>
                <Text style={styles.colTotal}>{formatToman(rowTotal, "fa")}</Text>
              </View>
            )
          })}
        </View>

        {/* Summary Totals */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.infoLabel}>جمع اقلام:</Text>
              <Text style={styles.infoValue}>{formatToman(subtotal, "fa")}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.infoLabel}>کرایه حمل:</Text>
              <Text style={styles.infoValue}>
                {order.shippingCost !== null && order.shippingCost !== undefined
                  ? formatToman(order.shippingCost, "fa")
                  : "مشخص نشده"}
              </Text>
            </View>
            <View style={styles.summaryRowTotal}>
              <Text style={{ fontSize: 9.5, fontWeight: "bold", color: "#0f172a" }}>مبلغ قابل پرداخت:</Text>
              <Text style={{ fontSize: 9.5, fontWeight: "bold", color: "#0f172a" }}>
                {formatToman(grandTotal, "fa")}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>این سند پیش‌فاکتور اولیه است و ارزش قانونی فاکتور رسمی مالیاتی را ندارد.</Text>
          <Text style={{ marginTop: 2 }}>
            سامانه تأمین و فروش آنلاین مصالح ساختمانی تیراژه — تماس: {company.phone}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
