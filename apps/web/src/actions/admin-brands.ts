"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

export async function adminCreateBrandAction(
  formData: FormData
): Promise<{ brandId: string }> {
  const user = await requireAdminPerm(PERMISSIONS.BRANDS_ALL)

  const nameFa = (formData.get("nameFa") as string | null)?.trim() ?? ""
  const nameEn = (formData.get("nameEn") as string | null)?.trim() || null
  const slug = (formData.get("slug") as string | null)?.trim() ?? ""
  const description = (formData.get("description") as string | null)?.trim() || null
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10)
  const isActive = formData.get("isActive") === "on"

  if (!nameFa) throw new Error("نام فارسی الزامی است")
  if (!slug) throw new Error("اسلاگ الزامی است")

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

  const brandId = (formData.get("brandId") as string | null)?.trim()
  if (!brandId) throw new Error("Brand ID missing")

  const nameFa = (formData.get("nameFa") as string | null)?.trim() ?? ""
  const nameEn = (formData.get("nameEn") as string | null)?.trim() || null
  const slug = (formData.get("slug") as string | null)?.trim() ?? ""
  const description = (formData.get("description") as string | null)?.trim() || null
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10)
  const isActive = formData.get("isActive") === "on"

  if (!nameFa) throw new Error("نام فارسی الزامی است")
  if (!slug) throw new Error("اسلاگ الزامی است")

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

  const brandId = (formData.get("brandId") as string | null)?.trim()
  if (!brandId) throw new Error("Brand ID missing")

  const productCount = await db.product.count({ where: { brandId } })
  if (productCount > 0) throw new Error(`این برند در ${productCount} محصول استفاده شده است`)

  await db.brand.delete({ where: { id: brandId } })

  await audit({
    userId: user.id,
    action: "brand.delete",
    resource: "Brand",
    resourceId: brandId,
  })

  revalidatePath("/admin/brands")
  return { ok: true }
}
