"use client"

import React, { useState, useTransition } from "react"
import { Plus, Edit2, Trash2, X, Building2 } from "lucide-react"
import { IRAN_PROVINCES } from "@tirajeh/shared"
import { useToast } from "@/components/admin/Toast"
import { InlineToggle } from "@/components/admin/DataTable"
import {
  adminCreateFactoryAction,
  adminUpdateFactoryAction,
  adminToggleFactoryStatusAction,
  adminDeleteFactoryAction,
} from "@/actions/admin-factories"
import styles from "@/components/admin/AdminCommon.module.css"

export interface FactoryItem {
  id: string
  nameFa: string
  nameEn: string | null
  city: string
  province: string
  latitude: number | null
  longitude: number | null
  isActive: boolean
  _count: {
    products: number
    shippingRates: number
  }
}

interface Props {
  locale: string
  fa: boolean
  factories: FactoryItem[]
}

export function FactoriesManager({
  fa,
  factories: initialFactories,
}: Props) {
  const { toast } = useToast()
  const [factories] = useState<FactoryItem[]>(initialFactories)
  const [isPending, startTransition] = useTransition()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingFactory, setEditingFactory] = useState<FactoryItem | null>(null)

  // Form fields
  const [nameFa, setNameFa] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [province, setProvince] = useState(IRAN_PROVINCES[0]?.nameFa ?? "تهران")
  const [city, setCity] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [isActive, setIsActive] = useState(true)

  const openCreateModal = () => {
    setEditingFactory(null)
    setNameFa("")
    setNameEn("")
    setProvince(IRAN_PROVINCES[0]?.nameFa ?? "تهران")
    setCity("")
    setLatitude("")
    setLongitude("")
    setIsActive(true)
    setModalOpen(true)
  }

  const openEditModal = (f: FactoryItem) => {
    setEditingFactory(f)
    setNameFa(f.nameFa)
    setNameEn(f.nameEn ?? "")
    setProvince(f.province)
    setCity(f.city)
    setLatitude(f.latitude != null ? String(f.latitude) : "")
    setLongitude(f.longitude != null ? String(f.longitude) : "")
    setIsActive(f.isActive)
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    if (editingFactory) fd.set("factoryId", editingFactory.id)
    fd.set("nameFa", nameFa)
    if (nameEn) fd.set("nameEn", nameEn)
    fd.set("province", province)
    fd.set("city", city)
    if (latitude) fd.set("latitude", latitude)
    if (longitude) fd.set("longitude", longitude)
    if (isActive) fd.set("isActive", "on")

    startTransition(async () => {
      try {
        if (editingFactory) {
          await adminUpdateFactoryAction(fd)
          toast.success(fa ? "کارخانه با موفقیت ویرایش شد" : "Factory updated successfully")
        } else {
          await adminCreateFactoryAction(fd)
          toast.success(fa ? "کارخانه با موفقیت ایجاد شد" : "Factory created successfully")
        }
        setModalOpen(false)
        window.location.reload()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : (fa ? "خطا در ثبت کارخانه" : "Failed to save factory"))
      }
    })
  }

  const handleDelete = (f: FactoryItem) => {
    if (f._count.products > 0 || f._count.shippingRates > 0) {
      toast.error(
        fa
          ? `امکان حذف کارخانه وجود ندارد زیرا به ${f._count.products} محصول و ${f._count.shippingRates} نرخ متصل است.`
          : `Cannot delete factory: linked to ${f._count.products} products and ${f._count.shippingRates} rates.`
      )
      return
    }

    if (!confirm(fa ? `آیا از حذف کارخانه «${f.nameFa}» اطمینان دارید؟` : `Delete factory "${f.nameFa}"?`)) return

    const fd = new FormData()
    fd.set("factoryId", f.id)

    startTransition(async () => {
      try {
        await adminDeleteFactoryAction(fd)
        toast.success(fa ? "کارخانه با موفقیت حذف شد" : "Factory deleted")
        window.location.reload()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : (fa ? "خطا در حذف کارخانه" : "Failed to delete factory"))
      }
    })
  }

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {fa ? "کارخانجات سیمان" : "Cement Factories"}
          </h1>
          <p className={styles.subtitle}>
            {fa
              ? "مدیریت کارخانه‌های تولیدکننده، محل بارگیری و پیوند به محصولات و کرایه حمل"
              : "Manage production plants, dispatch locations, and links to products and shipping"}
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={openCreateModal}
        >
          <Plus style={{ width: "1rem", height: "1rem" }} />
          <span>{fa ? "کارخانه جدید" : "New Factory"}</span>
        </button>
      </div>

      {/* Factories Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{fa ? "نام کارخانه" : "Factory Name"}</th>
              <th>{fa ? "استان و شهر" : "Province / City"}</th>
              <th className={styles.thCenter}>{fa ? "مختصات جغرافیایی" : "Coordinates"}</th>
              <th className={styles.thCenter}>{fa ? "تعداد محصولات" : "Products"}</th>
              <th className={styles.thCenter}>{fa ? "مسیرهای حمل" : "Shipping Routes"}</th>
              <th className={styles.thCenter}>{fa ? "وضعیت" : "Status"}</th>
              <th style={{ width: "90px" }}></th>
            </tr>
          </thead>
          <tbody>
            {factories.map((f) => (
              <tr key={f.id} className={styles.row}>
                <td style={{ fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Building2 style={{ width: "1rem", height: "1rem", color: "var(--color-text-muted)" }} />
                    <div>
                      <div>{f.nameFa}</div>
                      {f.nameEn && (
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                          {f.nameEn}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div>{f.province}</div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {f.city}
                  </div>
                </td>
                <td className={styles.tdCenter} style={{ fontSize: "var(--font-size-xs)", fontVariantNumeric: "tabular-nums" }}>
                  {f.latitude != null && f.longitude != null ? (
                    <span>{f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}</span>
                  ) : (
                    <span style={{ color: "var(--color-text-muted)" }}>—</span>
                  )}
                </td>
                <td className={styles.tdCenter} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {f._count.products}
                </td>
                <td className={styles.tdCenter} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {f._count.shippingRates}
                </td>
                <td className={styles.tdCenter}>
                  <InlineToggle
                    value={f.isActive}
                    onChange={async (nextVal) => {
                      await adminToggleFactoryStatusAction(f.id, nextVal)
                      toast.success(fa ? "وضعیت کارخانه تغییر یافت" : "Status updated")
                    }}
                    ariaLabel="Toggle factory status"
                  />
                </td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-1)", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openEditModal(f)}
                      title={fa ? "ویرایش کارخانه" : "Edit Factory"}
                    >
                      <Edit2 style={{ width: "0.85rem", height: "0.85rem" }} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleDelete(f)}
                      title={fa ? "حذف کارخانه" : "Delete Factory"}
                      disabled={f._count.products > 0 || f._count.shippingRates > 0}
                    >
                      <Trash2 style={{ width: "0.85rem", height: "0.85rem" }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {factories.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                  {fa ? "هنوز هیچ کارخانه‌ای ثبت نشده است." : "No factories registered."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 800, margin: 0 }}>
                {editingFactory
                  ? (fa ? "ویرایش کارخانه" : "Edit Factory")
                  : (fa ? "افزودن کارخانه جدید" : "New Factory")}
              </h2>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setModalOpen(false)}
              >
                <X style={{ width: "1.2rem", height: "1.2rem" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "نام فارسی کارخانه *" : "Factory Name (Fa) *"}</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={nameFa}
                    onChange={(e) => setNameFa(e.target.value)}
                    placeholder={fa ? "مثال: کارخانه سیمان تهران" : "Tehran Cement Plant"}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "نام انگلیسی" : "Factory Name (En)"}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Tehran Cement Plant..."
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "استان *" : "Province *"}</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
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
                  <label className={styles.label}>{fa ? "شهر *" : "City *"}</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={fa ? "مثال: ری" : "Ray"}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "عرض جغرافیایی (Latitude)" : "Latitude"}</label>
                  <input
                    type="number"
                    step="any"
                    dir="ltr"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="35.5892"
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{fa ? "طول جغرافیایی (Longitude)" : "Longitude"}</label>
                  <input
                    type="number"
                    step="any"
                    dir="ltr"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="51.4518"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field} style={{ marginTop: "var(--space-2)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>{fa ? "کارخانه فعال است" : "Factory is Active"}</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setModalOpen(false)}
                >
                  {fa ? "انصراف" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.primaryBtn}
                >
                  {isPending ? (fa ? "در حال ثبت..." : "Saving...") : (fa ? "ذخیره کارخانه" : "Save Factory")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
