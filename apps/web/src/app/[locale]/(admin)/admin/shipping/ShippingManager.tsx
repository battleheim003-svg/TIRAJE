"use client"

import React, { useState, useTransition } from "react"
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, X } from "lucide-react"
import { IRAN_PROVINCES, formatToman } from "@tirajeh/shared"
import { TruckType } from "@tirajeh/database"
import { useToast } from "@/components/admin/Toast"
import { InlineToggle } from "@/components/admin/DataTable"
import {
  adminCreateShippingZoneAction,
  adminUpdateShippingZoneAction,
  adminDeleteShippingZoneAction,
  adminCreateShippingRateAction,
  adminUpdateShippingRateAction,
  adminDeleteShippingRateAction,
  adminToggleShippingRateStatusAction,
} from "@/actions/admin-shipping"
import styles from "@/components/admin/AdminCommon.module.css"

interface Factory {
  id: string
  nameFa: string
  province: string
  city: string
}

interface ShippingRateItem {
  id: string
  factoryId: string
  zoneId: string
  truckType: TruckType
  baseCost: number | string
  costPerTon: number | string
  estimatedDays: number
  isActive: boolean
  factory: {
    id: string
    nameFa: string
  }
}

interface ShippingZoneItem {
  id: string
  nameFa: string
  nameEn: string | null
  province: string
  cities: string[]
  shippingRates: ShippingRateItem[]
  _count: {
    orders: number
  }
}

interface Props {
  locale: string
  fa: boolean
  initialZones: ShippingZoneItem[]
  factories: Factory[]
}

const TRUCK_TYPES: { value: TruckType; labelFa: string; labelEn: string }[] = [
  { value: "PICKUP_3T", labelFa: "وانت / نیسان (تا ۳ تن)", labelEn: "Pickup (3T)" },
  { value: "TRUCK_6T", labelFa: "خاور / کامیونت (تا ۶ تن)", labelEn: "Truck (6T)" },
  { value: "TRUCK_10T", labelFa: "کامیون تک (تا ۱۰ تن)", labelEn: "Truck (10T)" },
  { value: "TRAILER_22T", labelFa: "کامیون جفت (تا ۲۲ تن)", labelEn: "Trailer (22T)" },
  { value: "TRAILER_30T", labelFa: "تریلی کشنده (تا ۳۰ تن)", labelEn: "Heavy Trailer (30T)" },
]

export function ShippingManager({
  fa,
  initialZones,
  factories,
}: Props) {
  const { toast } = useToast()
  const [zones] = useState<ShippingZoneItem[]>(initialZones)
  const [expandedZoneIds, setExpandedZoneIds] = useState<Set<string>>(
    new Set(initialZones.slice(0, 1).map((z) => z.id))
  )
  const [isPending, startTransition] = useTransition()

  // Modals
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZoneItem | null>(null)

  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [targetZoneIdForRate, setTargetZoneIdForRate] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState<ShippingRateItem | null>(null)

  // Zone form fields
  const [zNameFa, setZNameFa] = useState("")
  const [zNameEn, setZNameEn] = useState("")
  const [zProvince, setZProvince] = useState(IRAN_PROVINCES[0]?.nameFa ?? "تهران")
  const [zCities, setZCities] = useState("")

  // Rate form fields
  const [rFactoryId, setRFactoryId] = useState("")
  const [rTruckType, setRTruckType] = useState<TruckType>("TRUCK_10T")
  const [rBaseCost, setRBaseCost] = useState("0")
  const [rCostPerTon, setRCostPerTon] = useState("0")
  const [rEstimatedDays, setREstimatedDays] = useState("1")
  const [rIsActive, setRIsActive] = useState(true)

  const toggleExpand = (zoneId: string) => {
    setExpandedZoneIds((prev) => {
      const next = new Set(prev)
      if (next.has(zoneId)) next.delete(zoneId)
      else next.add(zoneId)
      return next
    })
  }

  const openCreateZoneModal = () => {
    setEditingZone(null)
    setZNameFa("")
    setZNameEn("")
    setZProvince(IRAN_PROVINCES[0]?.nameFa ?? "تهران")
    setZCities("")
    setZoneModalOpen(true)
  }

  const openEditZoneModal = (z: ShippingZoneItem) => {
    setEditingZone(z)
    setZNameFa(z.nameFa)
    setZNameEn(z.nameEn ?? "")
    setZProvince(z.province)
    setZCities(z.cities.join("، "))
    setZoneModalOpen(true)
  }

  const openCreateRateModal = (zoneId: string) => {
    setEditingRate(null)
    setTargetZoneIdForRate(zoneId)
    setRFactoryId(factories[0]?.id ?? "")
    setRTruckType("TRUCK_10T")
    setRBaseCost("0")
    setRCostPerTon("0")
    setREstimatedDays("1")
    setRIsActive(true)
    setRateModalOpen(true)
  }

  const openEditRateModal = (zoneId: string, rate: ShippingRateItem) => {
    setEditingRate(rate)
    setTargetZoneIdForRate(zoneId)
    setRFactoryId(rate.factoryId)
    setRTruckType(rate.truckType)
    setRBaseCost(String(rate.baseCost))
    setRCostPerTon(String(rate.costPerTon))
    setREstimatedDays(String(rate.estimatedDays))
    setRIsActive(rate.isActive)
    setRateModalOpen(true)
  }

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    if (editingZone) fd.set("zoneId", editingZone.id)
    fd.set("nameFa", zNameFa)
    if (zNameEn) fd.set("nameEn", zNameEn)
    fd.set("province", zProvince)
    fd.set("cities", zCities.split(/[,،\n]/).map((s) => s.trim()).filter(Boolean).join(","))

    startTransition(async () => {
      try {
        if (editingZone) {
          await adminUpdateShippingZoneAction(fd)
          toast.success(fa ? "منطقه با موفقیت ویرایش شد" : "Shipping zone updated")
        } else {
          await adminCreateShippingZoneAction(fd)
          toast.success(fa ? "منطقه با موفقیت ایجاد شد" : "Shipping zone created")
        }
        setZoneModalOpen(false)
        window.location.reload()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : (fa ? "خطا در ثبت منطقه" : "Error saving zone"))
      }
    })
  }

  const handleDeleteZone = (zone: ShippingZoneItem) => {
    if (zone._count.orders > 0) {
      toast.error(
        fa
          ? `امکان حذف این منطقه وجود ندارد چون در ${zone._count.orders} سفارش ثبت شده است.`
          : `Cannot delete: used in ${zone._count.orders} orders.`
      )
      return
    }

    if (!confirm(fa ? `آیا از حذف منطقه «${zone.nameFa}» اطمینان دارید؟ تمام نرخ‌های حمل مربوط به آن نیز حذف خواهند شد.` : `Delete zone "${zone.nameFa}"?`)) {
      return
    }

    const fd = new FormData()
    fd.set("zoneId", zone.id)

    startTransition(async () => {
      try {
        await adminDeleteShippingZoneAction(fd)
        toast.success(fa ? "منطقه با موفقیت حذف شد" : "Shipping zone deleted")
        window.location.reload()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : (fa ? "خطا در حذف منطقه" : "Error deleting zone"))
      }
    })
  }

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetZoneIdForRate) return

    const fd = new FormData()
    if (editingRate) fd.set("rateId", editingRate.id)
    fd.set("zoneId", targetZoneIdForRate)
    fd.set("factoryId", rFactoryId)
    fd.set("truckType", rTruckType)
    fd.set("baseCost", rBaseCost)
    fd.set("costPerTon", rCostPerTon)
    fd.set("estimatedDays", rEstimatedDays)
    if (rIsActive) fd.set("isActive", "on")

    startTransition(async () => {
      try {
        if (editingRate) {
          await adminUpdateShippingRateAction(fd)
          toast.success(fa ? "نرخ حمل با موفقیت ویرایش شد" : "Shipping rate updated")
        } else {
          await adminCreateShippingRateAction(fd)
          toast.success(fa ? "نرخ حمل با موفقیت اضافه شد" : "Shipping rate added")
        }
        setRateModalOpen(false)
        window.location.reload()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : (fa ? "خطا در ثبت نرخ حمل" : "Error saving rate"))
      }
    })
  }

  const handleDeleteRate = (rate: ShippingRateItem) => {
    if (!confirm(fa ? "آیا از حذف این نرخ حمل اطمینان دارید؟" : "Delete this shipping rate?")) return

    const fd = new FormData()
    fd.set("rateId", rate.id)

    startTransition(async () => {
      try {
        await adminDeleteShippingRateAction(fd)
        toast.success(fa ? "نرخ حمل حذف شد" : "Shipping rate deleted")
        window.location.reload()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : (fa ? "خطا در حذف نرخ" : "Error deleting rate"))
      }
    })
  }

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {fa ? "مدیریت مناطق و نرخ‌های حمل" : "Shipping Zones & Rates"}
          </h1>
          <p className={styles.subtitle}>
            {fa
              ? "تعریف مناطق تحت پوشش ارسال، شهرها، و نرخ حمل کامیون از کارخانجات"
              : "Manage delivery zones, covered cities, and per-factory truck shipping rates"}
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={openCreateZoneModal}
        >
          <Plus style={{ width: "1rem", height: "1rem" }} />
          <span>{fa ? "منطقه حمل جدید" : "New Shipping Zone"}</span>
        </button>
      </div>

      {/* Zones Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
              <th>{fa ? "نام منطقه" : "Zone Name"}</th>
              <th>{fa ? "استان" : "Province"}</th>
              <th>{fa ? "شهرهای تحت پوشش" : "Covered Cities"}</th>
              <th className={styles.thCenter}>{fa ? "نرخ‌های فعال" : "Rates"}</th>
              <th className={styles.thCenter}>{fa ? "سفارش‌ها" : "Orders"}</th>
              <th style={{ width: "100px" }}></th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => {
              const isExpanded = expandedZoneIds.has(zone.id)
              return (
                <React.Fragment key={zone.id}>
                  <tr className={styles.row}>
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => toggleExpand(zone.id)}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown style={{ width: "1rem", height: "1rem" }} />
                        ) : (
                          <ChevronRight
                            style={{
                              width: "1rem",
                              height: "1rem",
                              transform: fa ? "rotate(180deg)" : "none",
                            }}
                          />
                        )}
                      </button>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <div>{zone.nameFa}</div>
                      {zone.nameEn && (
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                          {zone.nameEn}
                        </div>
                      )}
                    </td>
                    <td>{zone.province}</td>
                    <td style={{ maxWidth: "300px" }}>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                        {zone.cities.length > 0 ? zone.cities.join("، ") : (fa ? "تمامی شهرهای استان" : "All cities")}
                      </span>
                    </td>
                    <td className={styles.tdCenter}>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {zone.shippingRates.filter((r) => r.isActive).length} / {zone.shippingRates.length}
                      </span>
                    </td>
                    <td className={styles.tdCenter}>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {zone._count.orders}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-1)", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openEditZoneModal(zone)}
                          title={fa ? "ویرایش منطقه" : "Edit Zone"}
                        >
                          <Edit2 style={{ width: "0.85rem", height: "0.85rem" }} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDeleteZone(zone)}
                          title={fa ? "حذف منطقه" : "Delete Zone"}
                          disabled={zone._count.orders > 0}
                        >
                          <Trash2 style={{ width: "0.85rem", height: "0.85rem" }} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Nested Rates Table */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ backgroundColor: "var(--color-bg-subtle, rgba(0,0,0,0.015))", padding: "var(--space-4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                          <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 800, color: "var(--color-text)" }}>
                            {fa ? `نرخ‌های حمل برای منطقه «${zone.nameFa}»` : `Shipping Rates for ${zone.nameFa}`}
                          </span>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            style={{ fontSize: "var(--font-size-xs)", paddingBlock: "var(--space-1)", paddingInline: "var(--space-2)" }}
                            onClick={() => openCreateRateModal(zone.id)}
                          >
                            <Plus style={{ width: "0.8rem", height: "0.8rem" }} />
                            <span>{fa ? "افزودن نرخ جدید" : "Add Rate"}</span>
                          </button>
                        </div>

                        {zone.shippingRates.length === 0 ? (
                          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                            {fa ? "هنوز هیچ نرخ حملی برای این منطقه ثبت نشده است." : "No shipping rates defined for this zone."}
                          </p>
                        ) : (
                          <div className={styles.tableWrap} style={{ borderRadius: "var(--radius-md)" }}>
                            <table className={styles.table} style={{ fontSize: "var(--font-size-xs)" }}>
                              <thead>
                                <tr>
                                  <th>{fa ? "کارخانه مبدا" : "Origin Factory"}</th>
                                  <th>{fa ? "نوع وسیله نقلیه" : "Truck Type"}</th>
                                  <th>{fa ? "هزینه پایه" : "Base Cost"}</th>
                                  <th>{fa ? "هزینه هر تن" : "Cost / Ton"}</th>
                                  <th>{fa ? "زمان تخمینی" : "Est. Days"}</th>
                                  <th className={styles.thCenter}>{fa ? "فعال" : "Active"}</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {zone.shippingRates.map((rate) => {
                                  const truckInfo = TRUCK_TYPES.find((t) => t.value === rate.truckType)
                                  return (
                                    <tr key={rate.id}>
                                      <td style={{ fontWeight: 600 }}>{rate.factory.nameFa}</td>
                                      <td>{fa ? truckInfo?.labelFa : truckInfo?.labelEn}</td>
                                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatToman(Number(rate.baseCost))}</td>
                                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatToman(Number(rate.costPerTon))}</td>
                                      <td>{fa ? `${rate.estimatedDays} روز` : `${rate.estimatedDays} days`}</td>
                                      <td className={styles.tdCenter}>
                                        <InlineToggle
                                          value={rate.isActive}
                                          onChange={async (nextVal) => {
                                            await adminToggleShippingRateStatusAction(rate.id, nextVal)
                                            toast.success(fa ? "وضعیت نرخ بروز شد" : "Status updated")
                                          }}
                                          ariaLabel="Toggle rate status"
                                        />
                                      </td>
                                      <td>
                                        <div style={{ display: "flex", gap: "var(--space-1)", justifyContent: "flex-end" }}>
                                          <button
                                            type="button"
                                            className={styles.actionBtn}
                                            onClick={() => openEditRateModal(zone.id, rate)}
                                            title={fa ? "ویرایش نرخ" : "Edit Rate"}
                                          >
                                            <Edit2 style={{ width: "0.75rem", height: "0.75rem" }} />
                                          </button>
                                          <button
                                            type="button"
                                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                            onClick={() => handleDeleteRate(rate)}
                                            title={fa ? "حذف نرخ" : "Delete Rate"}
                                          >
                                            <Trash2 style={{ width: "0.75rem", height: "0.75rem" }} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Zone Modal */}
      {zoneModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, margin: 0 }}>
                {editingZone
                  ? (fa ? "ویرایش منطقه ارسال" : "Edit Shipping Zone")
                  : (fa ? "ایجاد منطقه ارسال جدید" : "New Shipping Zone")}
              </h2>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setZoneModalOpen(false)}
              >
                <X style={{ width: "1.2rem", height: "1.2rem" }} />
              </button>
            </div>

            <form onSubmit={handleSaveZone} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "نام منطقه (فارسی) *" : "Zone Name (Fa) *"}</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={zNameFa}
                    onChange={(e) => setZNameFa(e.target.value)}
                    placeholder={fa ? "مثال: منطقه ۱ - تهران مرکزی" : "Tehran Central"}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "نام انگلیسی" : "Zone Name (En)"}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={zNameEn}
                    onChange={(e) => setZNameEn(e.target.value)}
                    placeholder="Tehran Central..."
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{fa ? "استان *" : "Province *"}</label>
                <select
                  value={zProvince}
                  onChange={(e) => setZProvince(e.target.value)}
                  className={styles.select}
                >
                  {IRAN_PROVINCES.map((p) => (
                    <option key={p.nameFa} value={p.nameFa}>
                      {fa ? p.nameFa : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  {fa ? "شهرهای تحت پوشش (با کاما جدا کنید)" : "Cities (comma-separated)"}
                </label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={zCities}
                  onChange={(e) => setZCities(e.target.value)}
                  placeholder={fa ? "مثال: تهران، تجریش، شمیرانات" : "Tehran, Shemiranat..."}
                  className={styles.textarea}
                />
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {fa ? "در صورت خالی گذاشتن، کل استان تحت پوشش قرار می‌گیرد." : "Leave empty to cover the entire province."}
                </span>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setZoneModalOpen(false)}
                >
                  {fa ? "انصراف" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.primaryBtn}
                >
                  {isPending ? (fa ? "در حال ثبت..." : "Saving...") : (fa ? "ذخیره منطقه" : "Save Zone")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {rateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, margin: 0 }}>
                {editingRate
                  ? (fa ? "ویرایش نرخ حمل" : "Edit Shipping Rate")
                  : (fa ? "افزودن نرخ حمل جدید" : "New Shipping Rate")}
              </h2>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setRateModalOpen(false)}
              >
                <X style={{ width: "1.2rem", height: "1.2rem" }} />
              </button>
            </div>

            <form onSubmit={handleSaveRate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.field}>
                <label className={styles.label}>{fa ? "کارخانه مبدا *" : "Origin Factory *"}</label>
                <select
                  value={rFactoryId}
                  onChange={(e) => setRFactoryId(e.target.value)}
                  className={styles.select}
                  required
                >
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nameFa} ({f.province} - {f.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{fa ? "نوع وسیله نقلیه *" : "Truck Type *"}</label>
                <select
                  value={rTruckType}
                  onChange={(e) => setRTruckType(e.target.value as TruckType)}
                  className={styles.select}
                >
                  {TRUCK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {fa ? t.labelFa : t.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "هزینه پایه (تومان) *" : "Base Cost (Toman) *"}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={rBaseCost}
                    onChange={(e) => setRBaseCost(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "هزینه هر تن اضافه (تومان) *" : "Cost per Ton (Toman) *"}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={rCostPerTon}
                    onChange={(e) => setRCostPerTon(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "مدت زمان تخمینی تحویل (روز)" : "Estimated Days"}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rEstimatedDays}
                    onChange={(e) => setREstimatedDays(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field} style={{ justifyContent: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={rIsActive}
                      onChange={(e) => setRIsActive(e.target.checked)}
                    />
                    <span>{fa ? "نرخ فعال باشد" : "Rate is Active"}</span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setRateModalOpen(false)}
                >
                  {fa ? "انصراف" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.primaryBtn}
                >
                  {isPending ? (fa ? "در حال ثبت..." : "Saving...") : (fa ? "ذخیره نرخ" : "Save Rate")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
