"use server"

import { db, CementType, PackagingType, StockStatus, PackagingTier, DocType } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { publishProductToChannel } from "@tirajeh/integrations"
import { CEMENT_TYPE_LABEL, PACKAGING_LABEL } from "@/lib/cement"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

import { z } from "zod"

const ProductPackagingOptionInputSchema = z.object({
  tier: z.nativeEnum(PackagingTier),
  labelFa: z.string().min(1, "عنوان بسته‌بندی الزامی است"),
  labelEn: z.string().optional().nullable(),
  bagCount: z.coerce.number().int().positive("تعداد کیسه الزامی است"),
  price: z.coerce.number().int().nonnegative("قیمت باید نامنفی باشد"),
  comparePrice: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null
    return Number(v)
  }, z.number().int().nonnegative().nullable().optional()),
  stockQty: z.coerce.number().int().default(0),
  isDefault: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

const ProductDocumentInputSchema = z.object({
  title: z.string().min(1, "عنوان سند الزامی است"),
  url: z.string().url("آدرس سند نامعتبر است"),
  docType: z.nativeEnum(DocType),
})

const ProductAdminSchema = z.object({
  nameFa: z.string().min(1, "نام فارسی الزامی است").transform((s) => s.trim()),
  nameEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  slug: z.string().min(1, "اسلاگ الزامی است").regex(/^[a-z0-9-]+$/, "اسلاگ نامعتبر است").transform((s) => s.trim()),
  brandId: z.string().min(1, "برند الزامی است").transform((s) => s.trim()),
  cementType: z.nativeEnum(CementType).optional().nullable(),
  packagingType: z.nativeEnum(PackagingType, { errorMap: () => ({ message: "نوع بسته‌بندی الزامی است" }) }),
  weightKg: z.coerce.number().positive("وزن باید یک عدد مثبت باشد"),
  price: z.coerce.number().int().nonnegative("قیمت باید یک عدد نامنفی باشد"),
  comparePrice: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null
    return Number(v)
  }, z.number().int().nonnegative().nullable().optional()),
  stockStatus: z.nativeEnum(StockStatus).default("IN_STOCK"),
  stockQty: z.coerce.number().int().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(0),
  minOrderQty: z.coerce.number().int().positive().default(1),
  factoryId: z.string().optional().nullable().transform((s) => s?.trim() || null),
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  isFeatured: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  descriptionFa: z.string().optional().nullable().transform((s) => s?.trim() || null),
  descriptionEn: z.string().optional().nullable().transform((s) => s?.trim() || null),
  images: z.string().optional().nullable().transform((s) => s?.trim() || null),
  packagingOptions: z.string().optional().nullable().transform((s) => s?.trim() || null),
  documents: z.string().optional().nullable().transform((s) => s?.trim() || null),
  channelUsername: z.string().optional().nullable().transform((s) => s?.trim() || undefined),
  customHashtags: z.string().optional().nullable().transform((s) => s?.trim() || null),
})

function parseProductFormData(fd: FormData) {
  const raw = Object.fromEntries(fd.entries())
  const parsed = ProductAdminSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "داده‌های ورودی محصول نامعتبر است")
  }
  return parsed.data
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
        lowStockThreshold: data.lowStockThreshold,
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

    const imagesRaw = data.images
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

    const packagingRaw = data.packagingOptions
    if (packagingRaw) {
      try {
        const parsed = JSON.parse(packagingRaw)
        const validOptions = z.array(ProductPackagingOptionInputSchema).parse(parsed)
        if (validOptions.length > 0) {
          await db.productPackagingOption.createMany({
            data: validOptions.map((opt) => ({
              productId: product.id,
              tier: opt.tier,
              labelFa: opt.labelFa,
              labelEn: opt.labelEn,
              bagCount: opt.bagCount,
              price: opt.price,
              comparePrice: opt.comparePrice,
              stockQty: opt.stockQty,
              isDefault: opt.isDefault,
              sortOrder: opt.sortOrder,
              isActive: opt.isActive,
            })),
          })
        }
      } catch (e) {
        console.error("Failed to parse/save packaging options", e)
      }
    }

    const documentsRaw = data.documents
    if (documentsRaw) {
      try {
        const parsed = JSON.parse(documentsRaw)
        const validDocs = z.array(ProductDocumentInputSchema).parse(parsed)
        if (validDocs.length > 0) {
          await db.productDocument.createMany({
            data: validDocs.map((doc) => ({
              productId: product.id,
              title: doc.title,
              url: doc.url,
              docType: doc.docType,
            })),
          })
        }
      } catch (e) {
        console.error("Failed to parse/save product documents", e)
      }
    }

    const channelUsername = data.channelUsername
    const customHashtagsRaw = data.customHashtags
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

const ProductIdSchema = z.object({
  productId: z.string().min(1, "شناسه محصول الزامی است").transform((s) => s.trim()),
})

export async function adminUpdateProductAction(
  formData: FormData
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.PRODUCTS_UPDATE)

  const parsedId = ProductIdSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsedId.success) throw new Error(parsedId.error.issues[0]?.message ?? "شناسه محصول نامعتبر است")
  const { productId } = parsedId.data

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
        lowStockThreshold: data.lowStockThreshold,
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

  const imagesRaw = data.images
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

  const packagingRaw = data.packagingOptions
  if (packagingRaw) {
    try {
      const parsed = JSON.parse(packagingRaw)
      const validOptions = z.array(ProductPackagingOptionInputSchema).parse(parsed)
      await db.$transaction(async (tx) => {
        await tx.productPackagingOption.deleteMany({ where: { productId } })
        if (validOptions.length > 0) {
          await tx.productPackagingOption.createMany({
            data: validOptions.map((opt) => ({
              productId,
              tier: opt.tier,
              labelFa: opt.labelFa,
              labelEn: opt.labelEn,
              bagCount: opt.bagCount,
              price: opt.price,
              comparePrice: opt.comparePrice,
              stockQty: opt.stockQty,
              isDefault: opt.isDefault,
              sortOrder: opt.sortOrder,
              isActive: opt.isActive,
            })),
          })
        }
      })
    } catch (e) {
      console.error("Failed to parse/update packaging options", e)
    }
  }

  const documentsRaw = data.documents
  if (documentsRaw) {
    try {
      const parsed = JSON.parse(documentsRaw)
      const validDocs = z.array(ProductDocumentInputSchema).parse(parsed)
      await db.$transaction(async (tx) => {
        await tx.productDocument.deleteMany({ where: { productId } })
        if (validDocs.length > 0) {
          await tx.productDocument.createMany({
            data: validDocs.map((doc) => ({
              productId,
              title: doc.title,
              url: doc.url,
              docType: doc.docType,
            })),
          })
        }
      })
    } catch (e) {
      console.error("Failed to parse/update product documents", e)
    }
  }

  const channelUsername = data.channelUsername
  const customHashtagsRaw = data.customHashtags
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

  await db.product.update({
    where: { id: productId },
    data: { archivedAt: new Date(), isActive: false },
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

export async function adminRestoreProductAction(
  productId: string
): Promise<{ ok: true }> {
  const user = await requireAdminPerm(PERMISSIONS.PRODUCTS_UPDATE)
  if (!productId) throw new Error("Product ID missing")

  await db.product.update({
    where: { id: productId },
    data: { archivedAt: null, isActive: true },
  })

  await audit({
    userId: user.id,
    action: "product.restore",
    resource: "Product",
    resourceId: productId,
  })

  revalidatePath("/admin/products")
  return { ok: true }
}
