"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { revalidatePath } from "next/cache"

const ADMIN_ROLES = ["admin", "super_admin"]

async function requireAdmin() {
  const session = await auth()
  const roleName = (session?.user as any)?.roleName as string | undefined
  if (!session?.user || !roleName || !ADMIN_ROLES.includes(roleName)) {
    throw new Error("Unauthorized")
  }
  return session.user as any
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
  const admin = await requireAdmin()

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

  if (!titleFa || !slug || !contentFa) {
    throw new Error("فیلدهای الزامی پر نشده‌اند")
  }

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
        contentFa,
        contentEn,
        excerptFa,
        excerptEn,
        featuredImage,
        categoryId,
        status,
        publishedAt,
        seoTitle,
        seoDescription,
        readingTimeMin: readingTimeMin ? parseInt(readingTimeMin, 10) : null,
        authorId: admin.id,
      },
      select: { id: true },
    })
    revalidatePath("/admin/blog")
    return { postId: post.id }
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }
}

export async function adminUpdatePostAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdmin()

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

  if (!id || !titleFa || !slug || !contentFa) {
    throw new Error("فیلدهای الزامی پر نشده‌اند")
  }

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
        contentFa,
        contentEn,
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
    return { ok: true }
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }
}

export async function adminDeletePostAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdmin()
  const id = str(formData, "id")
  if (!id) throw new Error("شناسه مقاله الزامی است")
  await db.post.delete({ where: { id } })
  revalidatePath("/admin/blog")
  return { ok: true }
}
