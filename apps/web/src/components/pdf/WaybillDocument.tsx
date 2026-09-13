import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { registerPdfFonts, toJalali } from "@/lib/pdf-utils"
import { toFarsiDigits } from "@/lib/cement"

registerPdfFonts()

const TRUCK_TYPE_LABELS: Record<string, string> = {
  PICKUP_3T: "وانت (۳ تن)",
  TRUCK_6T: "خاور (۶ تن)",
  TRUCK_10T: "تک (۱۰ تن)",
  TRAILER_22T: "جفت (۱۵ تن / ۲۲ تن)",
  TRAILER_30T: "تریلی (۳۰ تن)",
}

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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  metaText: {
    fontSize: 8.5,
    color: "#475569",
    marginTop: 2,
    textAlign: "right",
  },
  section: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    padding: 8,
  },
  partiesRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  partyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    padding: 8,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
    marginBottom: 5,
    textAlign: "right",
  },
  fieldRow: {
    flexDirection: "row-reverse",
    marginBottom: 3,
  },
  label: {
    width: 60,
    color: "#64748b",
    fontSize: 8,
    textAlign: "right",
  },
  val: {
    flex: 1,
    color: "#1e293b",
    fontSize: 8,
    textAlign: "right",
  },
  table: {
    width: "100%",
    marginBottom: 14,
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
    paddingVertical: 4,
    fontSize: 8,
  },
  colIndex: { width: "8%", textAlign: "center" },
  colName: { width: "52%", textAlign: "right", paddingRight: 6 },
  colQty: { width: "20%", textAlign: "center" },
  colWeight: { width: "20%", textAlign: "center" },
  signaturesRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
  },
  signatureBox: {
    width: "30%",
    height: 70,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#94a3b8",
    borderRadius: 4,
    padding: 6,
    textAlign: "center",
  },
  signatureTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 4,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 7.5,
    color: "#64748b",
  },
})

export interface WaybillDocumentProps {
  order: {
    orderNumber: number | string
    createdAt: Date | string
    shippingProvince: string | null
    shippingTruckType: string | null
    totalAmount: number
    items: Array<{
      productNameFa: string
      quantity: number
      weightKg: number | null
    }>
    user: {
      name: string | null
      phone: string | null
    }
    shipment?: {
      truckPlate?: string | null
      driverName?: string | null
      driverPhone?: string | null
      trackingNote?: string | null
    } | null
  }
  company: {
    name: string
    phone: string
    address: string
  }
}

export function WaybillDocument({ order, company }: WaybillDocumentProps) {
  const jalaliDate = toJalali(order.createdAt)

  const totalWeightTon =
    order.items.reduce(
      (sum, item) => sum + (item.weightKg ?? 0) * item.quantity,
      0
    ) / 1000

  const truckLabel =
    (order.shippingTruckType && TRUCK_TYPE_LABELS[order.shippingTruckType]) ||
    order.shippingTruckType ||
    "تعیین‌نشده"

  const shipment = order.shipment

  return (
    <Document title={`بارنامه حمل سفارش #${order.orderNumber}`} author={company.name}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>بارنامه و حواله خروج بار</Text>
            <Text style={styles.metaText}>شرکت صادرکننده: {company.name}</Text>
          </View>
          <View style={{ alignItems: "flex-start" }}>
            <Text style={styles.metaText}>شماره سفارش: #{toFarsiDigits(order.orderNumber)}</Text>
            <Text style={styles.metaText}>تاریخ صدور: {jalaliDate}</Text>
          </View>
        </View>

        {/* Parties (Sender & Receiver) */}
        <View style={styles.partiesRow}>
          <View style={styles.partyCard}>
            <Text style={styles.sectionTitle}>مشخصات فرستنده (مبدأ)</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>نام فرستنده:</Text>
              <Text style={styles.val}>{company.name}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>تلفن تماس:</Text>
              <Text style={styles.val}>{company.phone}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>نشانی انبار:</Text>
              <Text style={styles.val}>{company.address}</Text>
            </View>
          </View>

          <View style={styles.partyCard}>
            <Text style={styles.sectionTitle}>مشخصات گیرنده (مقصد)</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>نام تحویل‌گیرنده:</Text>
              <Text style={styles.val}>{order.user.name || "مشتری محترم"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>تلفن گیرنده:</Text>
              <Text style={styles.val}>{order.user.phone ? toFarsiDigits(order.user.phone) : "—"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>استان مقصد:</Text>
              <Text style={styles.val}>{order.shippingProvince || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Cargo Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colIndex}>ردیف</Text>
            <Text style={styles.colName}>شرح محموله</Text>
            <Text style={styles.colQty}>تعداد (کیسه)</Text>
            <Text style={styles.colWeight}>وزن تقریبی (تن)</Text>
          </View>

          {order.items.map((item, idx) => {
            const rowWeightTon = ((item.weightKg ?? 0) * item.quantity) / 1000
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colIndex}>{toFarsiDigits(idx + 1)}</Text>
                <Text style={styles.colName}>{item.productNameFa}</Text>
                <Text style={styles.colQty}>{toFarsiDigits(item.quantity)}</Text>
                <Text style={styles.colWeight}>
                  {rowWeightTon > 0 ? toFarsiDigits(rowWeightTon.toFixed(1)) : "—"}
                </Text>
              </View>
            )
          })}

          <View
            style={[
              styles.tableRow,
              { backgroundColor: "#f8fafc", fontWeight: "bold", borderBottomWidth: 0 },
            ]}
          >
            <Text style={styles.colIndex}>—</Text>
            <Text style={[styles.colName, { fontWeight: "bold" }]}>مجموع وزن کل محموله</Text>
            <Text style={styles.colQty}>—</Text>
            <Text style={[styles.colWeight, { fontWeight: "bold" }]}>
              {toFarsiDigits(totalWeightTon.toFixed(1))} تن
            </Text>
          </View>
        </View>

        {/* Transport & Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اطلاعات ناوگان حمل و راننده</Text>
          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>نوع وسیله:</Text>
                <Text style={styles.val}>{truckLabel}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>شماره پلاک:</Text>
                <Text style={styles.val}>
                  {shipment?.truckPlate ? toFarsiDigits(shipment.truckPlate) : "......................................."}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>نام راننده:</Text>
                <Text style={styles.val}>
                  {shipment?.driverName || "......................................."}
                </Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>تلفن راننده:</Text>
                <Text style={styles.val}>
                  {shipment?.driverPhone ? toFarsiDigits(shipment.driverPhone) : "......................................."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>امضا و مهر فرستنده</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>امضا و اثر انگشت راننده</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>امضا و تأیید تحویل گیرنده</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            این بارنامه به منزله تحویل صحیح و سالم بار به راننده بوده و پس از تخلیه کامل در محل خریدار معتبر است.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
