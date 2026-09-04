import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import ProductForm from "../product-form"

export const metadata: Metadata = { title: "ویرایش محصول | پنل مدیریت تیراژه" }

type Props = { params: Promise<{ id: string }> }

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params
  const locale = await getLocale()
  const fa = locale === "fa"

  const [product, brands, factories] = await Promise.all([
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
      },
    }),
    db.brand.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true } }),
    db.factory.findMany({ orderBy: { nameFa: "asc" }, select: { id: true, nameFa: true, nameEn: true, city: true, province: true } }),
  ])

  if (!product) notFound()

  return (
    <>
      <div className="ape-root">
        <Link href={`/${locale}/admin/products`} className="ape-back">
          <ChevronLeft size={16} />
          {fa ? "بازگشت به محصولات" : "Back to Products"}
        </Link>

        <h1 className="ape-title">
          {fa ? "ویرایش محصول" : "Edit Product"}
          <span className="ape-slug">{product.slug}</span>
        </h1>

        <div className="ape-card">
          <ProductForm
            locale={locale}
            fa={fa}
            brands={brands}
            factories={factories}
            product={{
              ...product,
              nameEn: product.nameEn ?? null,
              cementType: product.cementType ?? null,
              comparePrice: product.comparePrice ?? null,
              factoryId: product.factoryId ?? null,
              descriptionFa: product.descriptionFa ?? null,
              descriptionEn: product.descriptionEn ?? null,
            }}
          />
        </div>
      </div>

      <style>{`
        .ape-root {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-width: 860px;
        }
        .ape-back {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          text-decoration: none;
          width: fit-content;
        }
        .ape-back:hover { color: var(--color-text); }
        .ape-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: var(--color-text);
          display: flex;
          align-items: baseline;
          gap: 0.625rem;
          flex-wrap: wrap;
        }
        .ape-slug {
          font-size: 0.8125rem;
          font-weight: 400;
          color: var(--color-text-muted);
          font-family: monospace;
          direction: ltr;
        }
        .ape-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
        }
      `}</style>
    </>
  )
}
