import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import ProductForm from "../product-form"
import styles from "../ProductForm.module.css"

export const metadata: Metadata = { title: "ویرایش محصول | پنل مدیریت تیراژه" }

type Props = { params: Promise<{ id: string }> }

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const [product, brands, factories, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      select: {
        id: true,
        nameFa: true,
        nameEn: true,
        slug: true,
        brandId: true,
        cementType: true,
        packagingType: true,
        weightKg: true,
        price: true,
        comparePrice: true,
        stockStatus: true,
        stockQty: true,
        minOrderQty: true,
        factoryId: true,
        isActive: true,
        isFeatured: true,
        descriptionFa: true,
        descriptionEn: true,
        images: {
          select: { url: true, isPrimary: true },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
      },
    }),
    db.brand.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true } }),
    db.factory.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true, city: true, province: true } }),
    db.category.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true } }),
  ])

  if (!product) notFound()

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0] ?? null

  return (
    <div className={styles["web-adm-prod-form__pageRoot"]}>
      <Link href={`/${locale}/admin/products`} className={styles["web-adm-prod-form__backLink"]}>
        <ChevronRight
          style={{
            width: "1rem",
            height: "1rem",
            transform: fa ? "rotate(0deg)" : "rotate(180deg)",
          }}
          aria-hidden="true"
        />
        {fa ? "بازگشت به محصولات" : "Back to Products"}
      </Link>

      <h1 className={styles["web-adm-prod-form__pageTitle"]}>
        <span>{fa ? "ویرایش محصول" : "Edit Product"}</span>
        <span className={styles["web-adm-prod-form__slugBadge"]}>{product.slug}</span>
      </h1>

      <div className={styles["web-adm-prod-form__pageCard"]}>
        <ProductForm
          locale={locale}
          fa={fa}
          brands={brands}
          factories={factories}
          categories={categories}
          product={{
            ...product,
            nameEn: product.nameEn ?? null,
            cementType: product.cementType ?? null,
            weightKg: Number(product.weightKg),
            price: Number(product.price),
            comparePrice: product.comparePrice != null ? Number(product.comparePrice) : null,
            factoryId: product.factoryId ?? null,
            descriptionFa: product.descriptionFa ?? null,
            descriptionEn: product.descriptionEn ?? null,
            primaryImageUrl: primaryImage?.url ?? null,
          }}
        />
      </div>
    </div>
  )
}
