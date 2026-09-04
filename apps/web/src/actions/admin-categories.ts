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

export async function adminCreateCategoryAction(
  formData: FormData
): Promise<{ categoryId: string }> {
  await requireAdmin()

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
    revalidatePath("/admin/categories")
    return { categoryId: category.id }
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }
}

export async function adminUpdateCategoryAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdmin()

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
  } catch (err: any) {
    if (err?.code === "P2002") throw new Error("این اسلاگ قبلاً استفاده شده است")
    throw err
  }

  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function adminDeleteCategoryAction(
  formData: FormData
): Promise<{ ok: true }> {
  await requireAdmin()

  const categoryId = (formData.get("categoryId") as string | null)?.trim()
  if (!categoryId) throw new Error("Category ID missing")

  const childCount = await db.category.count({ where: { parentId: categoryId } })
  if (childCount > 0) throw new Error("این دسته‌بندی دارای زیردسته است. ابتدا زیردسته‌ها را حذف کنید")

  const productCount = await db.productCategory.count({ where: { categoryId } })
  if (productCount > 0) throw new Error(`این دسته‌بندی در ${productCount} محصول استفاده شده است`)

  await db.category.delete({ where: { id: categoryId } })
  revalidatePath("/admin/categories")
  return { ok: true }
}
