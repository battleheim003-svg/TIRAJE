"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { publishPostToChannel } from "@tirajeh/integrations"
import sanitizeHtml from "sanitize-html"
import { requireAdminPerm, AdminUser } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

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

import { z } from "zod"

const AdminPostSchema = z.object({
  titleFa: z.string().min(1, "عنوان فارسی الزامی است").transform((s) => s.trim()),
  titleEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  slug: z.string().min(1, "اسلاگ الزامی است").regex(/^[a-z0-9-]+$/, "اسلاگ نامعتبر است").transform((s) => s.trim()),
  contentFa: z.string().min(1, "متن فارسی الزامی است").transform((s) => s.trim()),
  contentEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  excerptFa: z.string().optional().nullable().transform((s) => s?.trim() || null),
  excerptEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  featuredImage: z.string().optional().nullable().transform((s) => s?.trim() || null),
  categoryId: z.string().optional().nullable().transform((s) => s?.trim() || null),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
  seoTitle: z.string().optional().nullable().transform((s) => s?.trim() || null),
  seoDescription: z.string().optional().nullable().transform((s) => s?.trim() || null),
  readingTimeMin: z.preprocess((v) => {
    if (!v) return null
    const n = parseInt(String(v), 10)
    return isNaN(n) ? null : n
  }, z.number().int().positive().nullable().optional()),
  scheduledAt: z.preprocess((v) => {
    if (!v) return null
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? null : d
  }, z.date().nullable().optional()),
  channelUsername: z.string().optional().nullable().transform((s) => s?.trim() || undefined),
  customHashtags: z.string().optional().nullable().transform((s) => s?.trim() || null),
})

const AdminPostIdSchema = z.object({
  id: z.string().min(1, "شناسه مقاله الزامی است").transform((s) => s.trim()),
})

const AdminUpdatePostSchema = AdminPostSchema.extend({
  id: z.string().min(1, "شناسه مقاله الزامی است").transform((s) => s.trim()),
})

export async function adminCreatePostAction(
  formData: FormData
): Promise<{ postId: string }> {
  const user: AdminUser = await requireAdminPerm(PERMISSIONS.BLOG_ALL)

  const parsed = AdminPostSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی مقاله معتبر نیستند")
  }

  const {
    titleFa,
    titleEn,
    slug,
    contentFa,
    contentEn,
    excerptFa,
    excerptEn,
    featuredImage,
    categoryId,
    status,
    seoTitle,
    seoDescription,
    readingTimeMin,
    scheduledAt: scheduledAtDate,
    channelUsername,
    customHashtags: customHashtagsRaw,
  } = parsed.data

  let customHashtags: string[] | undefined = undefined
  if (customHashtagsRaw) {
    try {
      customHashtags = JSON.parse(customHashtagsRaw)
    } catch {
      customHashtags = customHashtagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    }
  }

  const cleanContentFa = contentFa ? sanitizeHtml(contentFa, sanitizeOptions) : null
  const cleanContentEn = contentEn ? sanitizeHtml(contentEn, sanitizeOptions) : null

  let publishedAt: Date | null = null
  let scheduledAt: Date | null = null
  if (status === "PUBLISHED") {
    publishedAt = new Date()
  } else if (status === "SCHEDULED" && scheduledAtDate) {
    scheduledAt = scheduledAtDate
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
        readingTimeMin,
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

    await audit({
      userId: user.id,
      action: "post.create",
      resource: "Post",
      resourceId: post.id,
    })

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
  const user = await requireAdminPerm(PERMISSIONS.BLOG_ALL)

  const parsed = AdminUpdatePostSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی مقاله معتبر نیستند")
  }

  const {
    id,
    titleFa,
    titleEn,
    slug,
    contentFa,
    contentEn,
    excerptFa,
    excerptEn,
    featuredImage,
    categoryId,
    status,
    seoTitle,
    seoDescription,
    readingTimeMin,
    scheduledAt: scheduledAtDate,
    channelUsername,
    customHashtags: customHashtagsRaw,
  } = parsed.data

  let customHashtags: string[] | undefined = undefined
  if (customHashtagsRaw) {
    try {
      customHashtags = JSON.parse(customHashtagsRaw)
    } catch {
      customHashtags = customHashtagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    }
  }

  const cleanContentFa = contentFa ? sanitizeHtml(contentFa, sanitizeOptions) : null
  const cleanContentEn = contentEn ? sanitizeHtml(contentEn, sanitizeOptions) : null

  const existing = await db.post.findUnique({ where: { id }, select: { publishedAt: true, status: true } })
  if (!existing) throw new Error("مقاله یافت نشد")

  let publishedAt: Date | null | undefined = undefined
  if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    publishedAt = existing.publishedAt ?? new Date()
  } else if (status === "SCHEDULED" && scheduledAtDate) {
    publishedAt = null
  } else if (status === "DRAFT") {
    publishedAt = null
  }

  try {
    await db.post.update({
      where: { id },
      data: {
        titleFa,
        titleEn,
        slug,
        contentFa: cleanContentFa || undefined,
        contentEn: cleanContentEn,
        excerptFa,
        excerptEn,
        featuredImage,
        categoryId,
        status,
        seoTitle,
        seoDescription,
        readingTimeMin,
        publishedAt: publishedAt !== undefined ? publishedAt : undefined,
      },
    })

    revalidatePath(`/admin/blog/${id}`)
    revalidatePath("/admin/blog")

    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
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

    await audit({
      userId: user.id,
      action: "post.update",
      resource: "Post",
      resourceId: id,
    })

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
  const user = await requireAdminPerm(PERMISSIONS.BLOG_ALL)
  const parsed = AdminPostIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "شناسه مقاله الزامی است")
  const { id } = parsed.data

  await db.post.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await audit({
    userId: user.id,
    action: "post.delete",
    resource: "Post",
    resourceId: id,
  })

  revalidatePath("/admin/blog")
  return { ok: true }
}

export async function adminRestorePostAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.BLOG_ALL)
  const parsed = AdminPostIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "شناسه مقاله الزامی است")
  const { id } = parsed.data

  await db.post.update({
    where: { id },
    data: { archivedAt: null },
  })

  await audit({
    userId: user.id,
    action: "post.restore",
    resource: "Post",
    resourceId: id,
  })

  revalidatePath("/admin/blog")
  return { ok: true }
}
