"use client"

import React, { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Send, Save } from "lucide-react"
import { adminCreatePostAction, adminUpdatePostAction } from "@/actions/admin-blog"
import { useToast } from "@/components/admin/Toast"
import { TagInput } from "@/components/admin/TagInput"
import { TelegramPostPreview } from "@/components/admin/TelegramPostPreview"
import { ImageUploadDropzone } from "@/components/admin/ImageUploadDropzone"
import { buildPostHashtags } from "@tirajeh/integrations/telegram/hashtags"
import styles from "./BlogForm.module.css"

interface Category {
  id: string
  nameFa: string
  nameEn: string | null
}

interface PostData {
  id: string
  titleFa: string
  titleEn: string | null
  slug: string
  contentFa: string
  contentEn: string | null
  excerptFa: string | null
  excerptEn: string | null
  featuredImage: string | null
  categoryId: string | null
  status: string
  publishedAt: Date | null
  seoTitle: string | null
  seoDescription: string | null
  readingTimeMin: number | null
}

interface Props {
  locale: string
  fa: boolean
  categories: Category[]
  post?: PostData
}

const DEFAULT_CHANNEL =
  process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_USERNAME || "@TirajehConcrete"

export function PostForm({ locale, fa, categories, post }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(post)

  // Form State
  const [featuredImage, setFeaturedImage] = useState<string | null>(
    post?.featuredImage ?? null
  )
  const [titleFa, setTitleFa] = useState(post?.titleFa ?? "")
  const [titleEn, setTitleEn] = useState(post?.titleEn ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [excerptFa, setExcerptFa] = useState(post?.excerptFa ?? "")
  const [contentFa, setContentFa] = useState(post?.contentFa ?? "")
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "")
  const [status, setStatus] = useState(post?.status ?? "DRAFT")
  const [scheduledAt, setScheduledAt] = useState("")
  const [channelUsername, setChannelUsername] = useState(DEFAULT_CHANNEL)

  // Auto-generate initial hashtags based on category
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  )

  const [hashtags, setHashtags] = useState<string[]>(() => {
    return buildPostHashtags({
      categoryFa: selectedCategory?.nameFa ?? null,
      tagFa: [],
    })
  })

  // When category changes and user hasn't heavily customized, update category tag
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId)
    const cat = categories.find((c) => c.id === catId)
    setHashtags((prev) => {
      const updated = buildPostHashtags({
        categoryFa: cat?.nameFa ?? null,
        tagFa: [],
      })
      // Keep any custom user-added tags that aren't the standard blog tags
      const extras = prev.filter((t) => t !== "#وبلاگ" && t !== "#تیراژه")
      return [...new Set([...updated, ...extras])].slice(0, 8)
    })
  }

  function slugify(v: string) {
    return v
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
  }

  const handleTitleFaChange = (val: string) => {
    setTitleFa(val)
    if (!isEdit && !slug) {
      setSlug(slugify(val))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const fd = new FormData()
    if (isEdit && post) fd.set("id", post.id)
    fd.set("titleFa", titleFa)
    if (titleEn) fd.set("titleEn", titleEn)
    fd.set("slug", slug || slugify(titleFa))
    fd.set("excerptFa", excerptFa)
    fd.set("contentFa", contentFa)
    if (featuredImage) fd.set("featuredImage", featuredImage)
    if (categoryId) fd.set("categoryId", categoryId)
    fd.set("status", status)
    if (status === "SCHEDULED" && scheduledAt) {
      fd.set("scheduledAt", scheduledAt)
    }
    fd.set("channelUsername", channelUsername)
    fd.set("customHashtags", JSON.stringify(hashtags))

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminUpdatePostAction(fd)
          toast.success(
            status === "PUBLISHED"
              ? fa
                ? "مقاله ویرایش و به تلگرام ارسال شد"
                : "Post updated and published to Telegram"
              : fa
              ? "تغییرات مقاله ذخیره شد"
              : "Post changes saved"
          )
          router.push(`/${locale}/admin/blog`)
        } else {
          await adminCreatePostAction(fd)
          toast.success(
            status === "PUBLISHED"
              ? fa
                ? "مقاله منتشر و به تلگرام ارسال شد"
                : "Post published and sent to Telegram"
              : fa
              ? "پیش‌نویس مقاله ذخیره شد"
              : "Post draft saved"
          )
          router.push(`/${locale}/admin/blog`)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : (fa ? "خطا در ذخیره‌سازی مقاله" : "Failed to save post")
        toast.error(message)
      }
    })
  }

  return (
    <div className={styles.tflContainer}>
      {/* Left Column (60%): Form Fields */}
      <div className={styles.tflFormCol}>
        <form onSubmit={handleSubmit} className={styles.tflFormCol}>
          {/* 1. Featured Image (Drag & drop zone) */}
          <div className={styles.tflField}>
            <label className={styles.tflLabel}>
              {fa ? "تصویر شاخص (عکس پست تلگرام) *" : "Featured Image (Telegram Photo) *"}
            </label>
            <ImageUploadDropzone
              name="featuredImage"
              value={featuredImage}
              onChange={(img) => setFeaturedImage(img)}
              label={fa ? "انتخاب یا کشیدن تصویر شاخص" : "Upload or drag featured image"}
              hint={fa ? "این تصویر در پست تلگرام و هدر مقاله نمایش داده می‌شود" : "Displayed in Telegram post and article header"}
            />
          </div>

          {/* 2. Title (Fa + En) */}
          <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
            <div className={styles.tflField}>
              <label htmlFor="pf-titleFa" className={styles.tflLabel}>
                {fa ? "موضوع / عنوان (فارسی) *" : "Title (Persian) *"}
              </label>
              <input
                id="pf-titleFa"
                type="text"
                required
                dir="rtl"
                value={titleFa}
                onChange={(e) => handleTitleFaChange(e.target.value)}
                placeholder={fa ? "عنوان جذاب مقاله..." : "Persian title..."}
                className={styles.tflInput}
              />
            </div>
            <div className={styles.tflField}>
              <label htmlFor="pf-titleEn" className={styles.tflLabel}>
                {fa ? "عنوان (انگلیسی)" : "Title (English)"}
              </label>
              <input
                id="pf-titleEn"
                type="text"
                dir="ltr"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="English title..."
                className={styles.tflInput}
              />
            </div>
          </div>

          {/* Slug & Category */}
          <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
            <div className={styles.tflField}>
              <label htmlFor="pf-slug" className={styles.tflLabel}>
                {fa ? "نامک (Slug) *" : "Slug *"}
              </label>
              <input
                id="pf-slug"
                type="text"
                required
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={styles.tflInput}
              />
            </div>
            <div className={styles.tflField}>
              <label htmlFor="pf-category" className={styles.tflLabel}>
                {fa ? "دسته‌بندی" : "Category"}
              </label>
              <select
                id="pf-category"
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={styles.tflSelect}
              >
                <option value="">{fa ? "— بدون دسته‌بندی —" : "— None —"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fa ? c.nameFa : (c.nameEn || c.nameFa)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Excerpt (Telegram caption - max 900 chars) */}
          <div className={styles.tflField}>
            <div className={styles.tflLabel}>
              <span>{fa ? "خلاصه / توضیحات کلی (کپشن تلگرام) *" : "Excerpt (Telegram Caption) *"}</span>
              <span
                className={`${styles.tflCounter} ${
                  excerptFa.length > 900
                    ? styles.tflCounterDanger
                    : excerptFa.length > 800
                    ? styles.tflCounterWarn
                    : ""
                }`}
              >
                {excerptFa.length} / 900
              </span>
            </div>
            <textarea
              id="pf-excerptFa"
              rows={4}
              required
              dir="rtl"
              maxLength={900}
              value={excerptFa}
              onChange={(e) => setExcerptFa(e.target.value)}
              placeholder={
                fa
                  ? "متن کوتاه و جذاب که در زیر عکس پست تلگرام قرار می‌گیرد..."
                  : "Short summary that appears in the Telegram post..."
              }
              className={styles.tflTextarea}
            />
          </div>

          {/* 4. Visual Divider & Main Content (Site only) */}
          <div className={styles.tflDivider}>
            <div className={styles.tflDividerLine} />
            <span className={styles.tflDividerBadge}>
              {fa ? "فقط در سایت نمایش داده می‌شود" : "Displayed on website only"}
            </span>
            <div className={styles.tflDividerLine} />
          </div>

          <div className={styles.tflField}>
            <label htmlFor="pf-contentFa" className={styles.tflLabel}>
              {fa ? "متن کامل مقاله (فارسی) *" : "Full Article Content (Persian) *"}
            </label>
            <textarea
              id="pf-contentFa"
              rows={10}
              required
              dir="rtl"
              value={contentFa}
              onChange={(e) => setContentFa(e.target.value)}
              placeholder={fa ? "متن کامل مقاله خود را در اینجا بنویسید..." : "Write full article..."}
              className={styles.tflTextarea}
            />
          </div>

          {/* 5. Hashtags (TagInput - max 8) */}
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

          {/* 6. Channel Username & 7. Status */}
          <div className={`${styles.tflRow} ${styles.tflRowTwo}`}>
            <div className={styles.tflField}>
              <label htmlFor="pf-channel" className={styles.tflLabel}>
                {fa ? "آیدی کانال تلگرام" : "Telegram Channel Username"}
              </label>
              <input
                id="pf-channel"
                type="text"
                dir="ltr"
                value={channelUsername}
                onChange={(e) => setChannelUsername(e.target.value)}
                placeholder="@TirajehConcrete"
                className={styles.tflInput}
              />
            </div>
            <div className={styles.tflField}>
              <label htmlFor="pf-status" className={styles.tflLabel}>
                {fa ? "وضعیت انتشار *" : "Publish Status *"}
              </label>
              <select
                id="pf-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.tflSelect}
              >
                <option value="DRAFT">{fa ? "پیش‌نویس" : "Draft"}</option>
                <option value="PUBLISHED">{fa ? "منتشر شده (ارسال به تلگرام)" : "Published (Send to Telegram)"}</option>
                <option value="SCHEDULED">{fa ? "زمان‌بندی شده" : "Scheduled"}</option>
                <option value="ARCHIVED">{fa ? "بایگانی" : "Archived"}</option>
              </select>
            </div>
          </div>

          {/* Scheduled At input if status === SCHEDULED */}
          {status === "SCHEDULED" && (
            <div className={styles.tflField}>
              <label htmlFor="pf-scheduled" className={styles.tflLabel}>
                {fa ? "تاریخ و زمان انتشار خودکار" : "Scheduled Date & Time"}
              </label>
              <input
                id="pf-scheduled"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={styles.tflInput}
              />
            </div>
          )}

          {/* 8. Submit Button */}
          <div className={styles.tflSubmitArea}>
            <button
              type="submit"
              disabled={isPending}
              className={`${styles.tflSubmitBtn} ${
                status === "PUBLISHED" ? styles.tflSubmitBtnSuccess : ""
              }`}
            >
              {status === "PUBLISHED" ? (
                <>
                  <Send style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden="true" />
                  <span>{isPending ? (fa ? "در حال ارسال..." : "Publishing...") : (fa ? "انتشار و ارسال به تلگرام" : "Publish to Telegram")}</span>
                </>
              ) : (
                <>
                  <Save style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden="true" />
                  <span>{isPending ? (fa ? "در حال ذخیره..." : "Saving...") : (fa ? "ذخیره پیش‌نویس" : "Save Draft")}</span>
                </>
              )}
            </button>

            <Link href={`/${locale}/admin/blog`} className={styles.tflCancelBtn}>
              {fa ? "انصراف" : "Cancel"}
            </Link>
          </div>
        </form>
      </div>

      {/* Right Column (40%): Live Telegram Preview */}
      <div className={styles.tflPreviewCol}>
        <TelegramPostPreview
          image={featuredImage}
          title={titleFa}
          excerpt={excerptFa}
          hashtags={hashtags}
          linkLabel="📖 مطالعه مقاله کامل"
          linkUrl={`https://tirajeconcrete.com/fa/blog/${slug || "slug"}`}
          channelUsername={channelUsername}
        />
      </div>
    </div>
  )
}
