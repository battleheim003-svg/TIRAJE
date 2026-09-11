"use client"

import React, { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Save, Copy, Check } from "lucide-react"
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
  minOrderQty: number
  factoryId: string | null
  isActive: boolean
  isFeatured: boolean
  descriptionFa: string | null
  descriptionEn: string | null
  primaryImageUrl?: string | null
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
  const [minOrderQty, setMinOrderQty] = useState(product?.minOrderQty ? String(product.minOrderQty) : "1")
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [isFeatured] = useState(product?.isFeatured ?? false)
  const [channelUsername, setChannelUsername] = useState(DEFAULT_CHANNEL)
  const [copied, setCopied] = useState(false)

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
    fd.set("minOrderQty", minOrderQty)
    if (isActive) fd.set("isActive", "on")
    if (isFeatured) fd.set("isFeatured", "on")
    fd.set("descriptionFa", fullDesc || shortDesc)
    if (image) fd.set("imageUrl", image)
    fd.set("channelUsername", channelUsername)
    fd.set("customHashtags", JSON.stringify(hashtags))

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

          {/* 9. Active/Inactive Toggle Switch */}
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
