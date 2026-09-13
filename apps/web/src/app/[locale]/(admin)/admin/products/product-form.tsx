"use client"

import React, { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Save, Copy, Check, Plus, Trash2 } from "lucide-react"
import {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
} from "@/lib/cement"
import {
  adminCreateProductAction,
  adminUpdateProductAction,
} from "@/actions/admin-products"
import { useToast } from "@/components/admin/Toast"
import { TagInput } from "@/components/admin/TagInput"
import { TelegramPostPreview } from "@/components/admin/TelegramPostPreview"
import { ImageUploadDropzone } from "@/components/admin/ImageUploadDropzone"
import { InlineToggle } from "@/components/admin/DataTable"
import { buildProductHashtags } from "@tirajeh/integrations/telegram/hashtags"
import styles from "./ProductForm.module.css"

export type PackagingTierType = "SINGLE" | "PAIR" | "TRUCK_6W" | "TRUCK_10W"
export type DocTypeVal = "DATASHEET" | "CERTIFICATE" | "MSDS" | "CATALOG"

export interface PackagingOptionItem {
  id?: string
  tier: PackagingTierType
  labelFa: string
  labelEn?: string | null
  bagCount: number
  price: number
  comparePrice?: number | null
  stockQty: number
  isDefault: boolean
  sortOrder: number
  isActive: boolean
}

export interface DocumentItem {
  id?: string
  title: string
  url: string
  docType: DocTypeVal
}

interface Brand {
  id: string
  nameFa: string
  nameEn: string | null
}

interface Factory {
  id: string
  nameFa: string
  nameEn: string | null
  city: string
  province: string
}

interface Category {
  id: string
  nameFa: string
  nameEn: string | null
}

export interface Product {
  id: string
  nameFa: string
  nameEn: string | null
  slug: string
  brandId: string
  cementType: string | null
  packagingType: string
  weightKg: number | string
  price: number | string
  comparePrice: number | string | null
  stockStatus: string
  stockQty: number
  lowStockThreshold?: number
  minOrderQty: number
  factoryId: string | null
  isActive: boolean
  isFeatured: boolean
  descriptionFa: string | null
  descriptionEn: string | null
  primaryImageUrl?: string | null
  packagingOptions?: PackagingOptionItem[]
  documents?: DocumentItem[]
}

interface Props {
  locale: string
  fa: boolean
  brands: Brand[]
  factories: Factory[]
  categories?: Category[]
  product?: Product
}

const CEMENT_TYPES = Object.entries(CEMENT_TYPE_LABEL)
const PACKAGING_TYPES = Object.entries(PACKAGING_LABEL)
const STOCK_STATUSES = Object.entries(STOCK_LABEL)

const DEFAULT_CHANNEL =
  process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_USERNAME || "@TirajehConcrete"

export default function ProductForm({
  locale,
  fa,
  brands,
  factories,
  categories: _categories = [],
  product,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(product)

  // Form State
  const [image, setImage] = useState<string | null>(product?.primaryImageUrl ?? null)
  const [nameFa, setNameFa] = useState(product?.nameFa ?? "")
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [shortDesc, setShortDesc] = useState(() => {
    if (!product?.descriptionFa) return ""
    return product.descriptionFa.slice(0, 300)
  })
  const [fullDesc, setFullDesc] = useState(product?.descriptionFa ?? "")
  const [brandId, setBrandId] = useState(product?.brandId ?? brands[0]?.id ?? "")
  const [factoryId, setFactoryId] = useState(product?.factoryId ?? "")
  const [cementType, setCementType] = useState(product?.cementType ?? "")
  const [packagingType, setPackagingType] = useState(product?.packagingType ?? PACKAGING_TYPES[0]?.[0] ?? "BAG_50KG")
  const [weightKg, setWeightKg] = useState(product?.weightKg ? String(product.weightKg) : "50")
  const [price, setPrice] = useState(product?.price ? String(product.price) : "")
  const [comparePrice, setComparePrice] = useState(product?.comparePrice ? String(product.comparePrice) : "")
  const [stockStatus, setStockStatus] = useState(product?.stockStatus ?? "IN_STOCK")
  const [stockQty, setStockQty] = useState(product?.stockQty ? String(product.stockQty) : "100")
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold ? String(product.lowStockThreshold) : "0")
  const [minOrderQty, setMinOrderQty] = useState(product?.minOrderQty ? String(product.minOrderQty) : "1")
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [isFeatured] = useState(product?.isFeatured ?? false)
  const [channelUsername, setChannelUsername] = useState(DEFAULT_CHANNEL)
  const [copied, setCopied] = useState(false)

  // Packaging Options State
  const [packagingOptions, setPackagingOptions] = useState<PackagingOptionItem[]>(() => {
    if (product?.packagingOptions && product.packagingOptions.length > 0) {
      return product.packagingOptions
    }
    return [
      {
        tier: "SINGLE",
        labelFa: "کیسه‌ای (تک کیسه)",
        labelEn: "Single Bag",
        bagCount: 1,
        price: Number(product?.price || 0),
        comparePrice: null,
        stockQty: 100,
        isDefault: true,
        sortOrder: 0,
        isActive: true,
      },
      {
        tier: "PAIR",
        labelFa: "بسته دو عددی",
        labelEn: "Double Bag",
        bagCount: 2,
        price: Number(product?.price || 0) * 2,
        comparePrice: null,
        stockQty: 50,
        isDefault: false,
        sortOrder: 1,
        isActive: true,
      },
    ]
  })

  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    return product?.documents ?? []
  })

  // Selected brand label for hashtags
  const selectedBrand = useMemo(() => brands.find((b) => b.id === brandId), [brands, brandId])

  // Hashtags
  const [hashtags, setHashtags] = useState<string[]>(() => {
    return buildProductHashtags({
      categoriesFa: [],
      brandFa: selectedBrand?.nameFa ?? null,
      cementTypeLabelFa: cementType ? CEMENT_TYPE_LABEL[cementType]?.fa : null,
      packagingLabelFa: packagingType ? PACKAGING_LABEL[packagingType]?.fa : null,
    })
  })

  function slugify(v: string) {
    return v
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
  }

  const handleNameFaChange = (val: string) => {
    setNameFa(val)
    if (!isEdit && !slug) {
      setSlug(slugify(val))
    }
  }

  const copyProductLink = () => {
    const url = `https://tirajeconcrete.com/fa/products/${slug || "product"}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.info(fa ? "لینک محصول کپی شد" : "Product link copied")
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const fd = new FormData()
    if (isEdit && product) fd.set("productId", product.id)
    fd.set("nameFa", nameFa)
    if (nameEn) fd.set("nameEn", nameEn)
    fd.set("slug", slug || slugify(nameFa))
    fd.set("brandId", brandId)
    if (factoryId) fd.set("factoryId", factoryId)
    if (cementType) fd.set("cementType", cementType)
    fd.set("packagingType", packagingType)
    fd.set("weightKg", weightKg)
    fd.set("price", price)
    if (comparePrice) fd.set("comparePrice", comparePrice)
    fd.set("stockStatus", stockStatus)
    fd.set("stockQty", stockQty)
    fd.set("lowStockThreshold", lowStockThreshold)
    fd.set("minOrderQty", minOrderQty)
    if (isActive) fd.set("isActive", "on")
    if (isFeatured) fd.set("isFeatured", "on")
    fd.set("descriptionFa", fullDesc || shortDesc)
    if (image) fd.set("imageUrl", image)
    fd.set("channelUsername", channelUsername)
    fd.set("customHashtags", JSON.stringify(hashtags))
    fd.set("packagingOptions", JSON.stringify(packagingOptions))
    fd.set("documents", JSON.stringify(documents))

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminUpdateProductAction(fd)
          toast.success(fa ? "محصول با موفقیت ویرایش شد" : "Product updated successfully")
          router.push(`/${locale}/admin/products`)
        } else {
          await adminCreateProductAction(fd)
          toast.success(fa ? "محصول با موفقیت ایجاد شد" : "Product created successfully")
          router.push(`/${locale}/admin/products`)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : (fa ? "خطا در ذخیره‌سازی محصول" : "Failed to save product")
        toast.error(message)
      }
    })
  }

  const productUrl = `https://tirajeconcrete.com/fa/products/${slug || "product"}`

  return (
    <div className={styles.tflContainer}>
      {/* Left Column (60%): Form Fields */}
      <div className={styles.tflFormCol}>
        <form onSubmit={handleSubmit} className={styles.tflFormCol}>
          {/* 1. Product Image (Drag & Drop, Primary = Telegram photo) */}
          <div className={styles.tflField}>
            <label className={styles.tflLabel}>
              {fa ? "تصویر اصلی محصول (عکس پست تلگرام) *" : "Primary Product Image (Telegram Photo) *"}
            </label>
            <ImageUploadDropzone
              name="imageUrl"
              value={image}
              onChange={(img) => setImage(img)}
              label={fa ? "انتخاب یا کشیدن تصویر محصول" : "Upload or drag product photo"}
              hint={fa ? "این تصویر به عنوان تصویر اصلی محصول در سایت و پست تلگرام درج می‌شود" : "Main product photo on website and Telegram post"}
            />
          </div>

          {/* 2. Product Name (Fa + En) */}
          <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
            <div className={styles.tflField}>
              <label htmlFor="prod-nameFa" className={styles.tflLabel}>
                {fa ? "نام محصول (فارسی) *" : "Product Name (Persian) *"}
              </label>
              <input
                id="prod-nameFa"
                type="text"
                required
                dir="rtl"
                value={nameFa}
                onChange={(e) => handleNameFaChange(e.target.value)}
                placeholder={fa ? "مثال: سیمان پرتلند تیپ ۲" : "Portland Cement Type 2"}
                className={styles.tflInput}
              />
            </div>
            <div className={styles.tflField}>
              <label htmlFor="prod-nameEn" className={styles.tflLabel}>
                {fa ? "نام محصول (انگلیسی)" : "Product Name (English)"}
              </label>
              <input
                id="prod-nameEn"
                type="text"
                dir="ltr"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Portland Cement Type 2..."
                className={styles.tflInput}
              />
            </div>
          </div>

          {/* Slug */}
          <div className={styles.tflField}>
            <label htmlFor="prod-slug" className={styles.tflLabel}>
              {fa ? "نامک (Slug) *" : "Slug *"}
            </label>
            <input
              id="prod-slug"
              type="text"
              required
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={styles.tflInput}
            />
          </div>

          {/* 3. Short Description (max 300 chars for Telegram) */}
          <div className={styles.tflField}>
            <div className={styles.tflLabel}>
              <span>{fa ? "توضیحات کوتاه (این متن در پست تلگرام نمایش داده می‌شود) *" : "Short Description (Telegram) *"}</span>
              <span
                className={`${styles.tflCounter} ${
                  shortDesc.length > 300
                    ? styles.tflCounterDanger
                    : shortDesc.length > 250
                    ? styles.tflCounterWarn
                    : ""
                }`}
              >
                {shortDesc.length} / 300
              </span>
            </div>
            <textarea
              id="prod-shortDesc"
              rows={3}
              required
              dir="rtl"
              maxLength={300}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder={fa ? "توضیحات مختصر و کاربردی برای پست تلگرام..." : "Short summary for Telegram post..."}
              className={styles.tflTextarea}
            />
          </div>

          {/* 4. Full Description (Site only) */}
          <div className={styles.tflDivider}>
            <div className={styles.tflDividerLine} />
            <span className={styles.tflDividerBadge}>
              {fa ? "فقط در سایت نمایش داده می‌شود" : "Displayed on website only"}
            </span>
            <div className={styles.tflDividerLine} />
          </div>

          <div className={styles.tflField}>
            <label htmlFor="prod-fullDesc" className={styles.tflLabel}>
              {fa ? "توضیحات کامل و مشخصات فنی (فارسی)" : "Full Description & Specs (Persian)"}
            </label>
            <textarea
              id="prod-fullDesc"
              rows={6}
              dir="rtl"
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              placeholder={fa ? "مشخصات فنی کامل، کاربردها و استانداردهای محصول..." : "Full product specifications..."}
              className={styles.tflTextarea}
            />
          </div>

          {/* 5. Product Page Link (Readonly + Copy Button) */}
          <div className={styles.tflField}>
            <label htmlFor="prod-url-readonly" className={styles.tflLabel}>
              {fa ? "لینک صفحه محصول (تولید خودکار)" : "Product Page URL"}
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                id="prod-url-readonly"
                type="text"
                readOnly
                dir="ltr"
                value={productUrl}
                className={styles.tflInput}
              />
              <button
                type="button"
                onClick={copyProductLink}
                className={styles.tflCancelBtn}
                title={fa ? "کپی آدرس" : "Copy URL"}
                style={{ padding: "0 0.875rem", flexShrink: 0 }}
              >
                {copied ? (
                  <Check style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
                ) : (
                  <Copy style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* 6. Hashtags */}
          <div className={styles.tflField}>
            <label className={styles.tflLabel}>
              {fa ? "هشتگ‌های تلگرام (حداکثر ۸ عدد)" : "Telegram Hashtags (Max 8)"}
            </label>
            <TagInput
              value={hashtags}
              onChange={setHashtags}
              max={8}
              placeholder={fa ? "هشتگ جدید تایپ کنید و Enter بزنید..." : "Type tag and press Enter..."}
            />
          </div>

          {/* 7. Channel Username */}
          <div className={styles.tflField}>
            <label htmlFor="prod-channel" className={styles.tflLabel}>
              {fa ? "آیدی کانال تلگرام" : "Telegram Channel Username"}
            </label>
            <input
              id="prod-channel"
              type="text"
              dir="ltr"
              value={channelUsername}
              onChange={(e) => setChannelUsername(e.target.value)}
              placeholder="@TirajehConcrete"
              className={styles.tflInput}
            />
          </div>

          {/* 8. Fieldset: Store Info */}
          <fieldset className={styles.tflFieldset}>
            <legend className={styles.tflLegend}>
              {fa ? "اطلاعات فروشگاه" : "Store & Pricing Information"}
            </legend>

            <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
              <div className={styles.tflField}>
                <label htmlFor="prod-price" className={styles.tflLabel}>
                  {fa ? "قیمت (تومان) *" : "Price (Toman) *"}
                </label>
                <input
                  id="prod-price"
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="250000"
                  className={styles.tflInput}
                />
              </div>
              <div className={styles.tflField}>
                <label htmlFor="prod-comparePrice" className={styles.tflLabel}>
                  {fa ? "قیمت خط‌خورده (تومان)" : "Compare Price (Toman)"}
                </label>
                <input
                  id="prod-comparePrice"
                  type="number"
                  min="0"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                  placeholder="280000"
                  className={styles.tflInput}
                />
              </div>
            </div>

            <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
              <div className={styles.tflField}>
                <label htmlFor="prod-brand" className={styles.tflLabel}>
                  {fa ? "برند تولیدکننده *" : "Brand *"}
                </label>
                <select
                  id="prod-brand"
                  required
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className={styles.tflSelect}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {fa ? b.nameFa : (b.nameEn || b.nameFa)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.tflField}>
                <label htmlFor="prod-factory" className={styles.tflLabel}>
                  {fa ? "کارخانه تولیدی" : "Factory"}
                </label>
                <select
                  id="prod-factory"
                  value={factoryId}
                  onChange={(e) => setFactoryId(e.target.value)}
                  className={styles.tflSelect}
                >
                  <option value="">{fa ? "— بدون کارخانه —" : "— None —"}</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {fa ? `${f.nameFa} (${f.city})` : `${f.nameEn || f.nameFa} (${f.city})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
              <div className={styles.tflField}>
                <label htmlFor="prod-cementType" className={styles.tflLabel}>
                  {fa ? "نوع سیمان" : "Cement Type"}
                </label>
                <select
                  id="prod-cementType"
                  value={cementType}
                  onChange={(e) => setCementType(e.target.value)}
                  className={styles.tflSelect}
                >
                  <option value="">{fa ? "— مشخص نشده —" : "— Unspecified —"}</option>
                  {CEMENT_TYPES.map(([key, label]) => (
                    <option key={key} value={key}>
                      {fa ? label.fa : label.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.tflField}>
                <label htmlFor="prod-packaging" className={styles.tflLabel}>
                  {fa ? "نوع بسته‌بندی *" : "Packaging *"}
                </label>
                <select
                  id="prod-packaging"
                  required
                  value={packagingType}
                  onChange={(e) => setPackagingType(e.target.value)}
                  className={styles.tflSelect}
                >
                  {PACKAGING_TYPES.map(([key, label]) => (
                    <option key={key} value={key}>
                      {fa ? label.fa : label.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
              <div className={styles.tflField}>
                <label htmlFor="prod-weight" className={styles.tflLabel}>
                  {fa ? "وزن هر واحد (کیلوگرم) *" : "Weight (kg) *"}
                </label>
                <input
                  id="prod-weight"
                  type="number"
                  step="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className={styles.tflInput}
                />
              </div>

              <div className={styles.tflField}>
                <label htmlFor="prod-stockStatus" className={styles.tflLabel}>
                  {fa ? "وضعیت موجودی *" : "Stock Status *"}
                </label>
                <select
                  id="prod-stockStatus"
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className={styles.tflSelect}
                >
                  {STOCK_STATUSES.map(([key, label]) => (
                    <option key={key} value={key}>
                      {fa ? label.fa : label.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
              <div className={styles.tflField}>
                <label htmlFor="prod-stockQty" className={styles.tflLabel}>
                  {fa ? "تعداد موجودی" : "Stock Quantity"}
                </label>
                <input
                  id="prod-stockQty"
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className={styles.tflInput}
                />
              </div>

              <div className={styles.tflField}>
                <label htmlFor="prod-lowStock" className={styles.tflLabel}>
                  {fa ? "آستانه هشدار موجودی" : "Low Stock Alert Threshold"}
                </label>
                <input
                  id="prod-lowStock"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="0"
                  className={styles.tflInput}
                />
              </div>

              <div className={styles.tflField}>
                <label htmlFor="prod-minOrder" className={styles.tflLabel}>
                  {fa ? "حداقل سفارش" : "Min Order Quantity"}
                </label>
                <input
                  id="prod-minOrder"
                  type="number"
                  min="1"
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(e.target.value)}
                  className={styles.tflInput}
                />
              </div>
            </div>
          </fieldset>

          {/* 9. Packaging Options (Tiers) */}
          <fieldset className={styles.tflFieldset}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <legend className={styles.tflLegend}>
                {fa ? "گزینه‌های بسته‌بندی و سفارش عمده" : "Packaging & Bulk Options"}
              </legend>
              <button
                type="button"
                className={styles.subTableBtnAdd}
                onClick={() => {
                  setPackagingOptions((prev) => [
                    ...prev,
                    {
                      tier: "TRUCK_6W",
                      labelFa: "کامیون تک (۶ چرخ)",
                      labelEn: "6-Wheel Truck",
                      bagCount: 200,
                      price: Number(price || 0) * 200,
                      comparePrice: null,
                      stockQty: 10,
                      isDefault: false,
                      sortOrder: prev.length,
                      isActive: true,
                    },
                  ])
                }}
              >
                <Plus style={{ width: "0.85rem", height: "0.85rem" }} />
                <span>{fa ? "افزودن بسته‌بندی" : "Add Option"}</span>
              </button>
            </div>

            <div className={styles.subTableWrapper}>
              <table className={styles.subTable}>
                <thead>
                  <tr>
                    <th>{fa ? "سطح (Tier)" : "Tier"}</th>
                    <th>{fa ? "عنوان فارسی" : "Title (Fa)"}</th>
                    <th>{fa ? "تعداد کیسه" : "Bags"}</th>
                    <th>{fa ? "قیمت (تومان)" : "Price"}</th>
                    <th>{fa ? "موجودی" : "Stock"}</th>
                    <th>{fa ? "پیش‌فرض" : "Default"}</th>
                    <th>{fa ? "فعال" : "Active"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {packagingOptions.map((opt, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          value={opt.tier}
                          onChange={(e) => {
                            const val = e.target.value as PackagingTierType
                            setPackagingOptions((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, tier: val } : o))
                            )
                          }}
                          className={styles.subTableInput}
                        >
                          <option value="SINGLE">SINGLE (تک)</option>
                          <option value="PAIR">PAIR (جفت)</option>
                          <option value="TRUCK_6W">TRUCK_6W (۶ چرخ)</option>
                          <option value="TRUCK_10W">TRUCK_10W (۱۰ چرخ / تریلی)</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={opt.labelFa}
                          onChange={(e) => {
                            const val = e.target.value
                            setPackagingOptions((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, labelFa: val } : o))
                            )
                          }}
                          className={styles.subTableInput}
                          dir="rtl"
                          placeholder={fa ? "عنوان فارسی" : "Title"}
                        />
                      </td>
                      <td style={{ width: "80px" }}>
                        <input
                          type="number"
                          min="1"
                          value={opt.bagCount}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1
                            setPackagingOptions((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, bagCount: val } : o))
                            )
                          }}
                          className={styles.subTableInput}
                        />
                      </td>
                      <td style={{ width: "120px" }}>
                        <input
                          type="number"
                          min="0"
                          value={opt.price}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setPackagingOptions((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, price: val } : o))
                            )
                          }}
                          className={styles.subTableInput}
                        />
                      </td>
                      <td style={{ width: "80px" }}>
                        <input
                          type="number"
                          min="0"
                          value={opt.stockQty}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0
                            setPackagingOptions((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, stockQty: val } : o))
                            )
                          }}
                          className={styles.subTableInput}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="radio"
                          name="defaultPackaging"
                          checked={opt.isDefault}
                          onChange={() => {
                            setPackagingOptions((prev) =>
                              prev.map((o, i) => ({ ...o, isDefault: i === idx }))
                            )
                          }}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={opt.isActive}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPackagingOptions((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, isActive: val } : o))
                            )
                          }}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.subTableBtnDel}
                          onClick={() => {
                            setPackagingOptions((prev) => prev.filter((_, i) => i !== idx))
                          }}
                          title={fa ? "حذف گزینه" : "Delete"}
                        >
                          <Trash2 style={{ width: "0.85rem", height: "0.85rem" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {packagingOptions.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                        {fa ? "هیچ گزینه بسته‌بندی اضافه نشده است" : "No packaging options added"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </fieldset>

          {/* 10. Product Documents (Technical Datasheets & Certificates) */}
          <fieldset className={styles.tflFieldset}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <legend className={styles.tflLegend}>
                {fa ? "اسناد و گواهی‌نامه‌های فنی" : "Technical Documents & Certificates"}
              </legend>
              <button
                type="button"
                className={styles.subTableBtnAdd}
                onClick={() => {
                  setDocuments((prev) => [
                    ...prev,
                    {
                      title: "برگه مشخصات فنی (Datasheet)",
                      url: "https://",
                      docType: "DATASHEET",
                    },
                  ])
                }}
              >
                <Plus style={{ width: "0.85rem", height: "0.85rem" }} />
                <span>{fa ? "افزودن سند" : "Add Document"}</span>
              </button>
            </div>

            <div className={styles.subTableWrapper}>
              <table className={styles.subTable}>
                <thead>
                  <tr>
                    <th>{fa ? "نوع سند" : "Type"}</th>
                    <th>{fa ? "عنوان سند" : "Document Title"}</th>
                    <th>{fa ? "آدرس اینترنتی (URL)" : "URL"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, idx) => (
                    <tr key={idx}>
                      <td style={{ width: "140px" }}>
                        <select
                          value={doc.docType}
                          onChange={(e) => {
                            const val = e.target.value as DocTypeVal
                            setDocuments((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, docType: val } : d))
                            )
                          }}
                          className={styles.subTableInput}
                        >
                          <option value="DATASHEET">DATASHEET (دیتاشیت)</option>
                          <option value="CERTIFICATE">CERTIFICATE (گواهی استاندارد)</option>
                          <option value="MSDS">MSDS (ایمنی مواد)</option>
                          <option value="CATALOG">CATALOG (کاتالوگ)</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={doc.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setDocuments((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, title: val } : d))
                            )
                          }}
                          className={styles.subTableInput}
                          dir="rtl"
                          placeholder={fa ? "مثال: گواهی استاندارد ملی" : "Certificate Title"}
                        />
                      </td>
                      <td>
                        <input
                          type="url"
                          value={doc.url}
                          onChange={(e) => {
                            const val = e.target.value
                            setDocuments((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, url: val } : d))
                            )
                          }}
                          className={styles.subTableInput}
                          dir="ltr"
                          placeholder="https://..."
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.subTableBtnDel}
                          onClick={() => {
                            setDocuments((prev) => prev.filter((_, i) => i !== idx))
                          }}
                          title={fa ? "حذف سند" : "Delete"}
                        >
                          <Trash2 style={{ width: "0.85rem", height: "0.85rem" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                        {fa ? "هیچ سندی اضافه نشده است" : "No documents added"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </fieldset>

          {/* 11. Active/Inactive Toggle Switch */}
          <div className={styles.tflSwitchRow}>
            <div className={styles.tflSwitchInfo}>
              <span className={styles.tflSwitchLabel}>
                {fa ? "وضعیت فعال در فروشگاه و کانال تلگرام" : "Active in Store & Telegram"}
              </span>
              <span className={styles.tflSwitchDesc}>
                {fa
                  ? "در صورت فعال بودن، محصول در فروشگاه نمایش داده شده و به کانال تلگرام ارسال می‌شود"
                  : "If active, product is visible in store and synced to Telegram"}
              </span>
            </div>
            <InlineToggle
              value={isActive}
              onChange={(v) => setIsActive(v)}
              ariaLabel="Active Status"
            />
          </div>

          {/* Submit area */}
          <div className={styles.tflSubmitArea}>
            <button
              type="submit"
              disabled={isPending}
              className={styles.tflSubmitBtn}
            >
              <Save style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden="true" />
              <span>{isPending ? (fa ? "در حال ذخیره..." : "Saving...") : (fa ? "ذخیره و همگام‌سازی محصول" : "Save & Sync Product")}</span>
            </button>

            <Link href={`/${locale}/admin/products`} className={styles.tflCancelBtn}>
              {fa ? "انصراف" : "Cancel"}
            </Link>
          </div>
        </form>
      </div>

      {/* Right Column (40%): Live Telegram Preview */}
      <div className={styles.tflPreviewCol}>
        <TelegramPostPreview
          image={image}
          title={nameFa}
          excerpt={shortDesc}
          hashtags={hashtags}
          linkLabel="🛒 مشاهده و خرید محصول"
          linkUrl={productUrl}
          channelUsername={channelUsername}
        />
      </div>
    </div>
  )
}
