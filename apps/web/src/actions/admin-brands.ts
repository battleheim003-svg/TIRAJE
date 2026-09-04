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

export async function adminCreateBrandAction(
  formData: FormData
): Promise<{ brandId: string }> {
  await requireAdmin()

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
    revalidatePath("/admin/brands")
    return { brandId: brand.id }
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }
}

export async function adminUpdateBrandAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdmin()

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
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }

  revalidatePath("/admin/brands")
  return { ok: true }
}

export async function adminDeleteBrandAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdmin()

  const brandId = (formData.get("brandId") as string | null)?.trim()
  if (!brandId) throw new Error("Brand ID missing")

  const productCount = await db.product.count({ where: { brandId } })
  if (productCount > 0) throw new Error(`این برند در ${productCount} محصول استفاده شده است`)

  await db.brand.delete({ where: { id: brandId } })
  revalidatePath("/admin/brands")
  return { ok: true }
}
