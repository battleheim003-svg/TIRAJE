"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

import { z } from "zod"

const CreateBrandSchema = z.object({
  nameFa: z.string().min(1, "نام فارسی الزامی است").transform((s) => s.trim()),
  nameEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  slug: z.string().min(1, "اسلاگ الزامی است").regex(/^[a-z0-9-]+$/, "اسلاگ نامعتبر است").transform((s) => s.trim()),
  description: z.string().optional().nullable().transform((s) => s?.trim() || null),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
})

const UpdateBrandSchema = CreateBrandSchema.extend({
  brandId: z.string().min(1, "شناسه برند الزامی است").transform((s) => s.trim()),
})

const BrandIdSchema = z.object({
  brandId: z.string().min(1, "شناسه برند الزامی است").transform((s) => s.trim()),
})

export async function adminCreateBrandAction(
  formData: FormData
): Promise<{ brandId: string }> {
  const user = await requireAdminPerm(PERMISSIONS.BRANDS_ALL)

  const parsed = CreateBrandSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی نامعتبر است")
  }

  const { nameFa, nameEn, slug, description, sortOrder, isActive } = parsed.data

  try {
    const brand = await db.brand.create({
      data: { nameFa, nameEn, slug, description, sortOrder, isActive },
      select: { id: true },
    })

    await audit({
      userId: user.id,
      action: "brand.create",
      resource: "Brand",
      resourceId: brand.id,
      after: { nameFa, slug },
    })

    revalidatePath("/admin/brands")
    return { brandId: brand.id }
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

export async function adminUpdateBrandAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.BRANDS_ALL)

  const parsed = UpdateBrandSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی نامعتبر است")
  }

  const { brandId, nameFa, nameEn, slug, description, sortOrder, isActive } = parsed.data

  try {
    await db.brand.update({
      where: { id: brandId },
      data: { nameFa, nameEn, slug, description, sortOrder, isActive },
    })

    await audit({
      userId: user.id,
      action: "brand.update",
      resource: "Brand",
      resourceId: brandId,
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

  revalidatePath("/admin/brands")
  return { ok: true }
}

export async function adminDeleteBrandAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.BRANDS_ALL)

  const parsed = BrandIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "شناسه برند نامعتبر است")
  }
  const { brandId } = parsed.data

  const productCount = await db.product.count({ where: { brandId } })
  if (productCount > 0) throw new Error(`این برند در ${productCount} محصول استفاده شده است`)

  await db.brand.update({
    where: { id: brandId },
    data: { archivedAt: new Date() },
  })

  await audit({
    userId: user.id,
    action: "brand.delete",
    resource: "Brand",
    resourceId: brandId,
  })

  revalidatePath("/admin/brands")
  return { ok: true }
}

export async function adminRestoreBrandAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.BRANDS_ALL)

  const parsed = BrandIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "شناسه برند نامعتبر است")
  }
  const { brandId } = parsed.data

  await db.brand.update({
    where: { id: brandId },
    data: { archivedAt: null },
  })

  await audit({
    userId: user.id,
    action: "brand.restore",
    resource: "Brand",
    resourceId: brandId,
  })

  revalidatePath("/admin/brands")
  return { ok: true }
}
