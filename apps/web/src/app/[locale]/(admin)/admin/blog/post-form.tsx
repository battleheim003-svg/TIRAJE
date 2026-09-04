"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { adminCreatePostAction, adminUpdatePostAction, adminDeletePostAction } from "@/actions/admin-blog"

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

const STATUS_OPTIONS = [
  { value: "DRAFT",     labelFa: "پیش‌نویس",   labelEn: "Draft"     },
  { value: "PUBLISHED", labelFa: "منتشر شده",  labelEn: "Published" },
  { value: "SCHEDULED", labelFa: "زمان‌بندی",  labelEn: "Scheduled" },
  { value: "ARCHIVED",  labelFa: "بایگانی",    labelEn: "Archived"  },
]

export function PostForm({ locale, fa, categories, post }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState(post?.status ?? "DRAFT")
  const [deleting, setDeleting] = useState(false)
  const isEdit = Boolean(post)

  function slugify(v: string) {
    return v
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
  }

  function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const slugInput = document.getElementById("pf-slug") as HTMLInputElement | null
    if (!post && slugInput && !slugInput.value) {
      slugInput.value = slugify(e.target.value)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (isEdit) {
          await adminUpdatePostAction(fd)
          router.refresh()
        } else {
          const { postId } = await adminCreatePostAction(fd)
          router.push(`/${locale}/admin/blog/${postId}`)
        }
      } catch (err: any) {
        setError(err?.message ?? (fa ? "خطایی رخ داد" : "An error occurred"))
      }
    })
  }

  function handleDelete() {
    if (!post) return
    if (!confirm(fa ? "این مقاله حذف شود؟ این عمل برگشت‌پذیر نیست." : "Delete this post? This cannot be undone.")) return
    setDeleting(true)
    const fd = new FormData()
    fd.set("id", post.id)
    startTransition(async () => {
      try {
        await adminDeletePostAction(fd)
        router.push(`/${locale}/admin/blog`)
      } catch (err: any) {
        setError(err?.message ?? (fa ? "خطا در حذف" : "Delete failed"))
        setDeleting(false)
      }
    })
  }

  const scheduledAt = post?.publishedAt && post.status === "SCHEDULED"
    ? new Date(post.publishedAt).toISOString().slice(0, 16)
    : ""

  return (
    <>
      <form onSubmit={handleSubmit} className="pf-form">
        {isEdit && <input type="hidden" name="id" value={post!.id} />}

        {error && (
          <div className="pf-error-banner" role="alert">{error}</div>
        )}

        {/* Main fields */}
        <div className="pf-card">
          <h2 className="pf-section-title">{fa ? "محتوای اصلی" : "Main content"}</h2>

          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-titleFa">
              {fa ? "عنوان فارسی" : "Persian title"} <span className="pf-req" aria-hidden="true">*</span>
            </label>
            <input
              id="pf-titleFa"
              name="titleFa"
              type="text"
              required
              defaultValue={post?.titleFa}
              onBlur={handleTitleBlur}
              className="pf-input"
              placeholder={fa ? "عنوان مقاله به فارسی" : "Article title in Persian"}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-titleEn">
              {fa ? "عنوان انگلیسی" : "English title"}
            </label>
            <input
              id="pf-titleEn"
              name="titleEn"
              type="text"
              defaultValue={post?.titleEn ?? ""}
              dir="ltr"
              className="pf-input"
              placeholder="Article title in English"
            />
          </div>

          <div className="pf-row">
            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-slug">
                Slug <span className="pf-req" aria-hidden="true">*</span>
              </label>
              <input
                id="pf-slug"
                name="slug"
                type="text"
                required
                defaultValue={post?.slug}
                dir="ltr"
                pattern="[a-z0-9-]+"
                title="فقط حروف کوچک، اعداد و خط تیره"
                className="pf-input pf-input--mono"
                placeholder="article-slug"
              />
            </div>
            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-readingTime">
                {fa ? "زمان مطالعه (دقیقه)" : "Reading time (min)"}
              </label>
              <input
                id="pf-readingTime"
                name="readingTimeMin"
                type="number"
                min={1}
                max={999}
                defaultValue={post?.readingTimeMin ?? ""}
                className="pf-input"
              />
            </div>
          </div>

          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-contentFa">
              {fa ? "محتوا (فارسی)" : "Content (Persian)"} <span className="pf-req" aria-hidden="true">*</span>
            </label>
            <textarea
              id="pf-contentFa"
              name="contentFa"
              required
              rows={18}
              defaultValue={post?.contentFa}
              className="pf-textarea"
              placeholder={fa ? "محتوای مقاله به فارسی (Markdown)" : "Article content in Persian (Markdown)"}
            />
            <span className="pf-hint">{fa ? "فرمت Markdown پشتیبانی می‌شود." : "Markdown formatting is supported."}</span>
          </div>

          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-contentEn">
              {fa ? "محتوا (انگلیسی)" : "Content (English)"}
            </label>
            <textarea
              id="pf-contentEn"
              name="contentEn"
              rows={10}
              defaultValue={post?.contentEn ?? ""}
              dir="ltr"
              className="pf-textarea"
              placeholder="Article content in English (Markdown)"
            />
          </div>
        </div>

        {/* Excerpts */}
        <div className="pf-card">
          <h2 className="pf-section-title">{fa ? "خلاصه و تصویر" : "Excerpt & image"}</h2>

          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-excerptFa">
              {fa ? "خلاصه فارسی" : "Persian excerpt"}
            </label>
            <textarea
              id="pf-excerptFa"
              name="excerptFa"
              rows={3}
              defaultValue={post?.excerptFa ?? ""}
              className="pf-textarea"
              placeholder={fa ? "خلاصه‌ای کوتاه از مقاله (نمایش در لیست)" : "Short summary shown in listing"}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-excerptEn">
              {fa ? "خلاصه انگلیسی" : "English excerpt"}
            </label>
            <textarea
              id="pf-excerptEn"
              name="excerptEn"
              rows={3}
              defaultValue={post?.excerptEn ?? ""}
              dir="ltr"
              className="pf-textarea"
            />
          </div>

          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-featuredImage">
              {fa ? "آدرس تصویر شاخص" : "Featured image URL"}
            </label>
            <input
              id="pf-featuredImage"
              name="featuredImage"
              type="url"
              defaultValue={post?.featuredImage ?? ""}
              dir="ltr"
              className="pf-input"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* SEO */}
        <div className="pf-card">
          <h2 className="pf-section-title">SEO</h2>
          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-seoTitle">
              {fa ? "عنوان SEO" : "SEO title"}
            </label>
            <input
              id="pf-seoTitle"
              name="seoTitle"
              type="text"
              defaultValue={post?.seoTitle ?? ""}
              className="pf-input"
              maxLength={70}
            />
          </div>
          <div className="pf-field">
            <label className="pf-label" htmlFor="pf-seoDescription">
              {fa ? "توضیحات SEO" : "SEO description"}
            </label>
            <textarea
              id="pf-seoDescription"
              name="seoDescription"
              rows={2}
              defaultValue={post?.seoDescription ?? ""}
              className="pf-textarea"
              maxLength={160}
            />
          </div>
        </div>

        {/* Sidebar: publish settings */}
        <div className="pf-sidebar">
          <div className="pf-card">
            <h2 className="pf-section-title">{fa ? "انتشار" : "Publishing"}</h2>

            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-status">{fa ? "وضعیت" : "Status"}</label>
              <select
                id="pf-status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="pf-select"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {fa ? s.labelFa : s.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {status === "SCHEDULED" && (
              <div className="pf-field">
                <label className="pf-label" htmlFor="pf-scheduledAt">
                  {fa ? "زمان انتشار" : "Publish at"}
                </label>
                <input
                  id="pf-scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                  defaultValue={scheduledAt}
                  className="pf-input"
                  dir="ltr"
                />
              </div>
            )}

            <div className="pf-field">
              <label className="pf-label" htmlFor="pf-category">
                {fa ? "دسته‌بندی" : "Category"}
              </label>
              <select
                id="pf-category"
                name="categoryId"
                defaultValue={post?.categoryId ?? ""}
                className="pf-select"
              >
                <option value="">{fa ? "بدون دسته" : "No category"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {fa ? c.nameFa : (c.nameEn ?? c.nameFa)}
                  </option>
                ))}
              </select>
            </div>

            <div className="pf-actions">
              <button type="submit" disabled={pending} className="pf-btn-save">
                {pending
                  ? (fa ? "در حال ذخیره…" : "Saving…")
                  : isEdit
                    ? (fa ? "ذخیره تغییرات" : "Save changes")
                    : (fa ? "ساخت مقاله" : "Create post")}
              </button>

              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending || deleting}
                  className="pf-btn-delete"
                >
                  {deleting ? (fa ? "در حال حذف…" : "Deleting…") : (fa ? "حذف مقاله" : "Delete")}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .pf-form {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 1024px) {
          .pf-form {
            grid-template-columns: 1fr 17rem;
            align-items: start;
          }
          /* sidebar spans all rows in the last column */
          .pf-sidebar { grid-row: 1 / -1; grid-column: 2; }
          /* main content cards stay in column 1 */
          .pf-card:not(.pf-sidebar .pf-card) { grid-column: 1; }
        }
        .pf-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex; flex-direction: column; gap: 1.125rem;
        }
        .pf-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }
        .pf-section-title {
          font-size: 0.9375rem; font-weight: 700; color: var(--color-text);
          padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border);
          margin-bottom: 0.25rem;
        }
        .pf-row { display: grid; grid-template-columns: 1fr; gap: 1.125rem; }
        @media (min-width: 640px) { .pf-row { grid-template-columns: 1fr 8rem; } }
        .pf-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .pf-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text); }
        .pf-req { color: var(--color-danger); }
        .pf-hint { font-size: 0.75rem; color: var(--color-text-muted); }
        .pf-input, .pf-textarea, .pf-select {
          width: 100%; padding: 0.5625rem 0.875rem;
          background-color: var(--color-background);
          border: 1px solid var(--color-border); border-radius: var(--radius-md);
          font-size: 0.9375rem; font-family: inherit; color: var(--color-text);
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .pf-input:focus, .pf-textarea:focus, .pf-select:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent);
        }
        .pf-input--mono { font-family: monospace; font-size: 0.875rem; direction: ltr; }
        .pf-textarea { resize: vertical; min-height: 6rem; }
        .pf-select { cursor: pointer; }
        .pf-actions { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.5rem; }
        .pf-btn-save {
          width: 100%; padding: 0.625rem 1rem;
          background-color: var(--color-accent); color: #fff;
          border: none; border-radius: var(--radius-md);
          font-size: 0.9375rem; font-weight: 600; font-family: inherit;
          cursor: pointer; transition: background-color var(--transition-fast), opacity var(--transition-fast);
        }
        .pf-btn-save:hover:not(:disabled) { background-color: var(--color-accent-hover); }
        .pf-btn-save:disabled { opacity: 0.65; cursor: not-allowed; }
        .pf-btn-save:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .pf-btn-delete {
          width: 100%; padding: 0.5rem 1rem;
          background: none; border: 1px solid var(--color-danger);
          border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500; font-family: inherit;
          color: var(--color-danger); cursor: pointer;
          transition: background-color var(--transition-fast), opacity var(--transition-fast);
        }
        .pf-btn-delete:hover:not(:disabled) { background-color: var(--color-danger-subtle); }
        .pf-btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
        .pf-error-banner {
          grid-column: 1 / -1;
          padding: 0.75rem 1rem;
          background-color: var(--color-danger-subtle); color: var(--color-danger);
          border-radius: var(--radius-md); font-size: 0.875rem;
        }
      `}</style>
    </>
  )
}
