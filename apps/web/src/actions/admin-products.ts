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

function parseProductFormData(fd: FormData) {
  const nameFa = (fd.get("nameFa") as string | null)?.trim() ?? ""
  const nameEn = (fd.get("nameEn") as string | null)?.trim() || null
  const slug = (fd.get("slug") as string | null)?.trim() ?? ""
  const brandId = (fd.get("brandId") as string | null)?.trim() ?? ""
  const cementType = (fd.get("cementType") as string | null)?.trim() || null
  const packagingType = (fd.get("packagingType") as string | null)?.trim() ?? ""
  const weightKg = parseFloat(fd.get("weightKg") as string)
  const price = parseInt(fd.get("price") as string, 10)
  const comparePriceRaw = (fd.get("comparePrice") as string | null)?.trim()
  const comparePrice = comparePriceRaw ? parseInt(comparePriceRaw, 10) : null
  const stockStatus = (fd.get("stockStatus") as string | null)?.trim() ?? "IN_STOCK"
  const stockQty = parseInt((fd.get("stockQty") as string) || "0", 10)
  const minOrderQty = parseInt((fd.get("minOrderQty") as string) || "1", 10)
  const factoryId = (fd.get("factoryId") as string | null)?.trim() || null
  const isActive = fd.get("isActive") === "on"
  const isFeatured = fd.get("isFeatured") === "on"
  const descriptionFa = (fd.get("descriptionFa") as string | null)?.trim() || null
  const descriptionEn = (fd.get("descriptionEn") as string | null)?.trim() || null

  if (!nameFa) throw new Error("نام فارسی الزامی است")
  if (!slug) throw new Error("اسلاگ الزامی است")
  if (!brandId) throw new Error("برند الزامی است")
  if (!packagingType) throw new Error("نوع بسته‌بندی الزامی است")
  if (isNaN(weightKg) || weightKg <= 0) throw new Error("وزن نامعتبر است")
  if (isNaN(price) || price < 0) throw new Error("قیمت نامعتبر است")

  return {
    nameFa,
    nameEn,
    slug,
    brandId,
    cementType: cementType as any,
    packagingType: packagingType as any,
    weightKg,
    price,
    comparePrice,
    stockStatus: stockStatus as any,
    stockQty,
    minOrderQty,
    factoryId,
    isActive,
    isFeatured,
    descriptionFa,
    descriptionEn,
  }
}

export async function adminCreateProductAction(
  formData: FormData
): Promise<{ productId: string }> {
  await requireAdmin()
  const data = parseProductFormData(formData)

  try {
    const product = await db.product.create({
      data: {
        nameFa: data.nameFa,
        nameEn: data.nameEn,
        slug: data.slug,
        brandId: data.brandId,
        cementType: data.cementType,
        packagingType: data.packagingType,
        weightKg: data.weightKg,
        price: data.price,
        comparePrice: data.comparePrice ?? undefined,
        stockStatus: data.stockStatus,
        stockQty: data.stockQty,
        minOrderQty: data.minOrderQty,
        factoryId: data.factoryId,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        descriptionFa: data.descriptionFa,
        descriptionEn: data.descriptionEn,
      },
      select: { id: true },
    })

    revalidatePath("/admin/products")
    return { productId: product.id }
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }
}

export async function adminUpdateProductAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdmin()

  const productId = (formData.get("productId") as string | null)?.trim()
  if (!productId) throw new Error("Product ID missing")

  const data = parseProductFormData(formData)

  try {
    await db.product.update({
      where: { id: productId },
      data: {
        nameFa: data.nameFa,
        nameEn: data.nameEn,
        slug: data.slug,
        brandId: data.brandId,
        cementType: data.cementType,
        packagingType: data.packagingType,
        weightKg: data.weightKg,
        price: data.price,
        comparePrice: data.comparePrice ?? null,
        stockStatus: data.stockStatus,
        stockQty: data.stockQty,
        minOrderQty: data.minOrderQty,
        factoryId: data.factoryId,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        descriptionFa: data.descriptionFa,
        descriptionEn: data.descriptionEn,
      },
    })
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/admin/products")
  return { ok: true }
}
