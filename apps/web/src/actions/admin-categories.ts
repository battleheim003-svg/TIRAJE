"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

import { z } from "zod"

const CreateCategorySchema = z.object({
  nameFa: z.string().min(1, "نام فارسی الزامی است").transform((s) => s.trim()),
  nameEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  slug: z.string().min(1, "اسلاگ الزامی است").regex(/^[a-z0-9-]+$/, "اسلاگ نامعتبر است").transform((s) => s.trim()),
  parentId: z.string().optional().nullable().transform((s) => s?.trim() || null),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
})

const UpdateCategorySchema = CreateCategorySchema.extend({
  categoryId: z.string().min(1, "شناسه دسته‌بندی الزامی است").transform((s) => s.trim()),
})

const CategoryIdSchema = z.object({
  categoryId: z.string().min(1, "شناسه دسته‌بندی الزامی است").transform((s) => s.trim()),
})

export async function adminCreateCategoryAction(
  formData: FormData
): Promise<{ categoryId: string }> {
  const user = await requireAdminPerm(PERMISSIONS.CATEGORIES_ALL)

  const parsed = CreateCategorySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی نامعتبر است")
  }

  const { nameFa, nameEn, slug, parentId, sortOrder, isActive } = parsed.data

  try {
    const category = await db.category.create({
      data: { nameFa, nameEn, slug, parentId, sortOrder, isActive },
      select: { id: true },
    })

    await audit({
      userId: user.id,
      action: "category.create",
      resource: "Category",
      resourceId: category.id,
      after: { nameFa, slug },
    })

    revalidatePath("/admin/categories")
    return { categoryId: category.id }
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

export async function adminUpdateCategoryAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.CATEGORIES_ALL)

  const parsed = UpdateCategorySchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی نامعتبر است")
  }

  const { categoryId, nameFa, nameEn, slug, parentId, sortOrder, isActive } = parsed.data

  try {
    await db.category.update({
      where: { id: categoryId },
      data: { nameFa, nameEn, slug, parentId, sortOrder, isActive },
    })

    await audit({
      userId: user.id,
      action: "category.update",
      resource: "Category",
      resourceId: categoryId,
      after: { nameFa, slug },
    })
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

  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function adminDeleteCategoryAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.CATEGORIES_ALL)

  const parsed = CategoryIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "شناسه دسته‌بندی نامعتبر است")
  }
  const { categoryId } = parsed.data

  const childCount = await db.category.count({ where: { parentId: categoryId } })
  if (childCount > 0) throw new Error("این دسته‌بندی دارای زیردسته است. ابتدا زیردسته‌ها را حذف کنید")

  const productCount = await db.productCategory.count({ where: { categoryId } })
  if (productCount > 0) throw new Error(`این دسته‌بندی در ${productCount} محصول استفاده شده است`)

  await db.category.update({
    where: { id: categoryId },
    data: { archivedAt: new Date() },
  })

  await audit({
    userId: user.id,
    action: "category.delete",
    resource: "Category",
    resourceId: categoryId,
  })

  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function adminRestoreCategoryAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.CATEGORIES_ALL)

  const parsed = CategoryIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "شناسه دسته‌بندی نامعتبر است")
  }
  const { categoryId } = parsed.data

  await db.category.update({
    where: { id: categoryId },
    data: { archivedAt: null },
  })

  await audit({
    userId: user.id,
    action: "category.restore",
    resource: "Category",
    resourceId: categoryId,
  })

  revalidatePath("/admin/categories")
  return { ok: true }
}
