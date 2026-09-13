"use server"

import { db, CementType, PackagingType, StockStatus } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { publishProductToChannel } from "@tirajeh/integrations"
import { CEMENT_TYPE_LABEL, PACKAGING_LABEL } from "@/lib/cement"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

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
    cementType: (cementType as CementType | null) ?? null,
    packagingType: packagingType as PackagingType,
    weightKg,
    price,
    comparePrice,
    stockStatus: stockStatus as StockStatus,
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
  const user = await requireAdminPerm(PERMISSIONS.PRODUCTS_CREATE)
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

    await audit({
      userId: user.id,
      action: "product.create",
      resource: "Product",
      resourceId: product.id,
      after: { name: data.nameFa, price: data.price },
    })

    revalidatePath("/admin/products")

    const imagesRaw = (formData.get("images") as string | null)?.trim()
    if (imagesRaw) {
      try {
        const parsedImages: Array<{ url: string; sortOrder: number; isPrimary: boolean }> = JSON.parse(imagesRaw)
        if (parsedImages.length > 0) {
          await db.productImage.createMany({
            data: parsedImages.map(img => ({
              productId: product.id,
              url: img.url,
              sortOrder: img.sortOrder,
              isPrimary: img.isPrimary,
            }))
          })
        }
      } catch(e) { console.error("Failed to parse images JSON", e) }
    }

    const channelUsername = (formData.get("channelUsername") as string | null)?.trim() || undefined
    const customHashtagsRaw = (formData.get("customHashtags") as string | null)?.trim()
    let customHashtags: string[] | undefined = undefined
    if (customHashtagsRaw) {
      try {
        customHashtags = JSON.parse(customHashtagsRaw)
      } catch {
        customHashtags = customHashtagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      }
    }

    if (data.isActive) {
      void syncProductToTelegram(product.id, { customHashtags, channelUsername })
    }

    return { productId: product.id }
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }
}

async function syncProductToTelegram(
  productId: string,
  options?: { customHashtags?: string[]; channelUsername?: string }
): Promise<void> {
  try {
    const full = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        brand: true,
        productCategories: { include: { category: true } },
      },
    })
    if (!full || !full.isActive) return

    const primaryImage = full.images.find((img) => img.isPrimary) ?? full.images[0] ?? null
    const cementTypeLabel = full.cementType && CEMENT_TYPE_LABEL[full.cementType]
      ? CEMENT_TYPE_LABEL[full.cementType].fa
      : null
    const packagingLabel = full.packagingType && PACKAGING_LABEL[full.packagingType]
      ? PACKAGING_LABEL[full.packagingType].fa
      : null

    await publishProductToChannel({
      id: full.id,
      nameFa: full.nameFa,
      descriptionFa: full.descriptionFa,
      primaryImageUrl: primaryImage?.url ?? null,
      price: Number(full.price),
      categoriesFa: full.productCategories.map((pc) => pc.category.nameFa),
      brandFa: full.brand?.nameFa ?? null,
      cementTypeLabelFa: cementTypeLabel,
      packagingLabelFa: packagingLabel,
      slug: full.slug,
      customHashtags: options?.customHashtags,
      channelUsername: options?.channelUsername,
    })
  } catch (err) {
    console.error("[telegram:syncProductToTelegram] error:", err)
  }
}

export async function adminUpdateProductAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.PRODUCTS_UPDATE)

  const productId = (formData.get("productId") as string | null)?.trim()
  if (!productId) throw new Error("Product ID missing")

  const data = parseProductFormData(formData)

  const oldProduct = await db.product.findUnique({
    where: { id: productId },
    select: { price: true },
  })

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

    await audit({
      userId: user.id,
      action: "product.update",
      resource: "Product",
      resourceId: productId,
      before: { price: oldProduct?.price },
      after: { price: data.price },
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

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath("/admin/products")

  const imagesRaw = (formData.get("images") as string | null)?.trim()
  if (imagesRaw) {
    try {
      const parsedImages: Array<{ url: string; sortOrder: number; isPrimary: boolean }> = JSON.parse(imagesRaw)
      if (parsedImages.length > 0) {
        await db.$transaction(async (tx) => {
          await tx.productImage.deleteMany({ where: { productId } })
          await tx.productImage.createMany({
            data: parsedImages.map(img => ({
              productId,
              url: img.url,
              sortOrder: img.sortOrder,
              isPrimary: img.isPrimary,
            }))
          })
        })
      } else {
        await db.productImage.deleteMany({ where: { productId } })
      }
    } catch(e) { console.error("Failed to parse images JSON", e) }
  }

  const channelUsername = (formData.get("channelUsername") as string | null)?.trim() || undefined
  const customHashtagsRaw = (formData.get("customHashtags") as string | null)?.trim()
  let customHashtags: string[] | undefined = undefined
  if (customHashtagsRaw) {
    try {
      customHashtags = JSON.parse(customHashtagsRaw)
    } catch {
      customHashtags = customHashtagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    }
  }

  if (data.isActive) {
    void syncProductToTelegram(productId, { customHashtags, channelUsername })
  }

  return { ok: true }
}

export async function adminToggleProductStatusAction(
  productId: string,
  isActive: boolean
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.PRODUCTS_UPDATE)
  if (!productId) throw new Error("Product ID missing")

  await db.product.update({
    where: { id: productId },
    data: { isActive },
  })

  await audit({
    userId: user.id,
    action: "product.status_changed",
    resource: "Product",
    resourceId: productId,
    after: { isActive },
  })

  revalidatePath("/admin/products")

  if (isActive) {
    void syncProductToTelegram(productId)
  }

  return { ok: true }
}

export async function adminDeleteProductAction(
  productId: string
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.PRODUCTS_DELETE)
  if (!productId) throw new Error("Product ID missing")

  await db.product.delete({
    where: { id: productId },
  })

  await audit({
    userId: user.id,
    action: "product.archive",
    resource: "Product",
    resourceId: productId,
  })

  revalidatePath("/admin/products")
  return { ok: true }
}
