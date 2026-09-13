"use server"

import { db } from "@tirajeh/database"
import { revalidatePath } from "next/cache"
import { requireAdminPerm } from "@/lib/admin-guard"
import { PERMISSIONS } from "@tirajeh/shared"
import { audit } from "@/lib/audit"

export async function adminCreateCategoryAction(
  formData: FormData
): Promise<{ categoryId: string }> {
  const user = await requireAdminPerm(PERMISSIONS.CATEGORIES_ALL)

  const nameFa = (formData.get("nameFa") as string | null)?.trim() ?? ""
  const nameEn = (formData.get("nameEn") as string | null)?.trim() || null
  const slug = (formData.get("slug") as string | null)?.trim() ?? ""
  const parentId = (formData.get("parentId") as string | null)?.trim() || null
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10)
  const isActive = formData.get("isActive") === "on"

  if (!nameFa) throw new Error("نام فارسی الزامی است")
  if (!slug) throw new Error("اسلاگ الزامی است")

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

  const categoryId = (formData.get("categoryId") as string | null)?.trim()
  if (!categoryId) throw new Error("Category ID missing")

  const nameFa = (formData.get("nameFa") as string | null)?.trim() ?? ""
  const nameEn = (formData.get("nameEn") as string | null)?.trim() || null
  const slug = (formData.get("slug") as string | null)?.trim() ?? ""
  const parentId = (formData.get("parentId") as string | null)?.trim() || null
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10)
  const isActive = formData.get("isActive") === "on"

  if (!nameFa) throw new Error("نام فارسی الزامی است")
  if (!slug) throw new Error("اسلاگ الزامی است")

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

  const categoryId = (formData.get("categoryId") as string | null)?.trim()
  if (!categoryId) throw new Error("Category ID missing")

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

  const categoryId = (formData.get("categoryId") as string | null)?.trim()
  if (!categoryId) throw new Error("Category ID missing")

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
