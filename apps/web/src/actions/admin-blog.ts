"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { publishPostToChannel } from "@tirajeh/integrations"
import sanitizeHtml from "sanitize-html"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "a", "img",
  "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td",
]

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["https", "http", "data"],
}

function str(fd: FormData, key: string): string {
  return ((fd.get(key) as string | null)?.trim() ?? "")
}
function strOrNull(fd: FormData, key: string): string | null {
  const v = (fd.get(key) as string | null)?.trim()
  return v || null
}

export async function adminCreatePostAction(
  formData: FormData
): Promise<{ postId: string }> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.BLOG_ALL)

  const titleFa   = str(formData, "titleFa")
  const titleEn   = strOrNull(formData, "titleEn")
  const slug      = str(formData, "slug")
  const contentFa = str(formData, "contentFa")
  const contentEn = strOrNull(formData, "contentEn")
  const excerptFa = strOrNull(formData, "excerptFa")
  const excerptEn = strOrNull(formData, "excerptEn")
  const featuredImage  = strOrNull(formData, "featuredImage")
  const categoryId     = strOrNull(formData, "categoryId")
  const status         = (str(formData, "status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED"
  const seoTitle       = strOrNull(formData, "seoTitle")
  const seoDescription = strOrNull(formData, "seoDescription")
  const readingTimeMin = strOrNull(formData, "readingTimeMin")
  const scheduledAtRaw = strOrNull(formData, "scheduledAt")
  const channelUsername = strOrNull(formData, "channelUsername") || undefined
  const customHashtagsRaw = strOrNull(formData, "customHashtags")
  let customHashtags: string[] | undefined = undefined
  if (customHashtagsRaw) {
    try {
      customHashtags = JSON.parse(customHashtagsRaw)
    } catch {
      customHashtags = customHashtagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    }
  }

  if (!titleFa || !slug || !contentFa) {
    throw new Error("فیلدهای الزامی پر نشده‌اند")
  }

  const cleanContentFa = contentFa ? sanitizeHtml(contentFa, sanitizeOptions) : null
  const cleanContentEn = contentEn ? sanitizeHtml(contentEn, sanitizeOptions) : null

  let publishedAt: Date | null = null
  let scheduledAt: Date | null = null
  if (status === "PUBLISHED") {
    publishedAt = new Date()
  } else if (status === "SCHEDULED" && scheduledAtRaw) {
    scheduledAt = new Date(scheduledAtRaw)
    publishedAt = scheduledAt
  }

  try {
    const post = await db.post.create({
      data: {
        titleFa,
        titleEn,
        slug,
        contentFa: cleanContentFa || "",
        contentEn: cleanContentEn,
        excerptFa,
        excerptEn,
        featuredImage,
        categoryId,
        status,
        publishedAt,
        seoTitle,
        seoDescription,
        readingTimeMin: readingTimeMin ? parseInt(readingTimeMin, 10) : null,
        authorId: user.id,
      },
      select: { id: true },
    })
    revalidatePath("/admin/blog")

    if (status === "PUBLISHED") {
      const full = await db.post.findUnique({
        where: { id: post.id },
        include: { category: true, postTags: { include: { tag: true } } },
      })
      if (full) {
        void publishPostToChannel({
          id: full.id,
          titleFa: full.titleFa,
          excerptFa: full.excerptFa,
          featuredImage: full.featuredImage,
          categoryFa: full.category?.nameFa ?? null,
          tagsFa: full.postTags.map((pt) => pt.tag.nameFa),
          slug: full.slug,
          customHashtags,
          channelUsername,
        })
      }
    }

    return { postId: post.id }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      throw new Error("این اسلاگ قبلاً استفاده شده است")
    }
    throw err
  }
}

export async function adminUpdatePostAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdminPerm(PERMISSIONS.BLOG_ALL)

  const id        = str(formData, "id")
  const titleFa   = str(formData, "titleFa")
  const titleEn   = strOrNull(formData, "titleEn")
  const slug      = str(formData, "slug")
  const contentFa = str(formData, "contentFa")
  const contentEn = strOrNull(formData, "contentEn")
  const excerptFa = strOrNull(formData, "excerptFa")
  const excerptEn = strOrNull(formData, "excerptEn")
  const featuredImage  = strOrNull(formData, "featuredImage")
  const categoryId     = strOrNull(formData, "categoryId")
  const status         = (str(formData, "status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED"
  const seoTitle       = strOrNull(formData, "seoTitle")
  const seoDescription = strOrNull(formData, "seoDescription")
  const readingTimeMin = strOrNull(formData, "readingTimeMin")
  const scheduledAtRaw = strOrNull(formData, "scheduledAt")
  const channelUsername = strOrNull(formData, "channelUsername") || undefined
  const customHashtagsRaw = strOrNull(formData, "customHashtags")
  let customHashtags: string[] | undefined = undefined
  if (customHashtagsRaw) {
    try {
      customHashtags = JSON.parse(customHashtagsRaw)
    } catch {
      customHashtags = customHashtagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    }
  }

  if (!id || !titleFa || !slug || !contentFa) {
    throw new Error("فیلدهای الزامی پر نشده‌اند")
  }

  const cleanContentFa = contentFa ? sanitizeHtml(contentFa, sanitizeOptions) : null
  const cleanContentEn = contentEn ? sanitizeHtml(contentEn, sanitizeOptions) : null

  const existing = await db.post.findUnique({ where: { id }, select: { publishedAt: true, status: true } })
  if (!existing) throw new Error("مقاله یافت نشد")

  let publishedAt: Date | null | undefined = undefined
  if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    publishedAt = existing.publishedAt ?? new Date()
  } else if (status === "SCHEDULED" && scheduledAtRaw) {
    publishedAt = new Date(scheduledAtRaw)
  } else if (status === "DRAFT" || status === "ARCHIVED") {
    publishedAt = null
  }

  try {
    await db.post.update({
      where: { id },
      data: {
        titleFa,
        titleEn,
        slug,
        contentFa: cleanContentFa || "",
        contentEn: cleanContentEn,
        excerptFa,
        excerptEn,
        featuredImage,
        categoryId,
        status,
        seoTitle,
        seoDescription,
        readingTimeMin: readingTimeMin ? parseInt(readingTimeMin, 10) : null,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      },
    })
    revalidatePath("/admin/blog")
    revalidatePath(`/admin/blog/${id}`)

    if (status === "PUBLISHED") {
      const full = await db.post.findUnique({
        where: { id },
        include: { category: true, postTags: { include: { tag: true } } },
      })
      if (full) {
        void publishPostToChannel({
          id: full.id,
          titleFa: full.titleFa,
          excerptFa: full.excerptFa,
          featuredImage: full.featuredImage,
          categoryFa: full.category?.nameFa ?? null,
          tagsFa: full.postTags.map((pt) => pt.tag.nameFa),
          slug: full.slug,
          customHashtags,
          channelUsername,
        })
      }
    }

    return { ok: true }
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: unknown }).code === "P2002"
    ) {
      throw new Error("این اسلاگ قبلاً استفاده شده است")
    }
    throw err
  }
}

export async function adminDeletePostAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdminPerm(PERMISSIONS.BLOG_ALL)
  const id = str(formData, "id")
  if (!id) throw new Error("شناسه مقاله الزامی است")
  await db.post.delete({ where: { id } })
  revalidatePath("/admin/blog")
  return { ok: true }
}
