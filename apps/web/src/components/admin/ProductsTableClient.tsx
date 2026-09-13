"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Package, RotateCcw } from "lucide-react"
import { DataTable, Column, StatusBadge, InlineToggle } from "./DataTable"
import { ConfirmDialog } from "./ConfirmDialog"
import { useToast } from "./Toast"
import {
  CEMENT_TYPE_LABEL,
  PACKAGING_LABEL,
  STOCK_LABEL,
  STOCK_VARIANT,
  formatToman,
} from "@/lib/cement"
import {
  adminToggleProductStatusAction,
  adminDeleteProductAction,
  adminRestoreProductAction,
} from "@/actions/admin-products"
import { InlinePriceCell } from "./InlinePriceCell"

export interface ProductRow {
  id: string
  nameFa: string
  nameEn: string | null
  slug: string
  brand: { nameFa: string; nameEn: string | null }
  cementType: string | null
  packagingType: string
  price: number
  stockStatus: string
  isActive: boolean
  archivedAt?: Date | string | null
}

interface ProductsTableClientProps {
  products: ProductRow[]
  locale: string
  fa: boolean
  isArchived?: boolean
}

export function ProductsTableClient({
  products: initialProducts,
  locale,
  fa,
  isArchived = false,
}: ProductsTableClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  // Sync if server props change (e.g. on navigation / search)
  React.useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const handleToggleActive = async (product: ProductRow, nextVal: boolean) => {
    try {
      await adminToggleProductStatusAction(product.id, nextVal)
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: nextVal } : p))
      )
      toast.success(
        nextVal
          ? fa
            ? "محصول فعال شد"
            : "Product activated"
          : fa
          ? "محصول غیرفعال شد"
          : "Product deactivated"
      )
    } catch {
      toast.error(fa ? "خطا در تغییر وضعیت محصول" : "Failed to update product status")
      throw new Error("Failed to toggle status")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminDeleteProductAction(deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success(fa ? "محصول با موفقیت حذف شد" : "Product deleted successfully")
      setDeleteTarget(null)
    } catch {
      toast.error(fa ? "خطا در حذف محصول" : "Failed to delete product")
    } finally {
      setDeleting(false)
    }
  }

  const handleRestore = async (product: ProductRow) => {
    try {
      await adminRestoreProductAction(product.id)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      toast.success(fa ? "محصول با موفقیت بازگردانی شد" : "Product restored successfully")
    } catch {
      toast.error(fa ? "خطا در بازگردانی محصول" : "Failed to restore product")
    }
  }

  const columns: Column<ProductRow>[] = [
    {
      key: "nameFa",
      header: fa ? "نام محصول" : "Product",
      render: (row) => {
        const title = fa ? row.nameFa : (row.nameEn || row.nameFa)
        return (
          <Link
            href={`/${locale}/admin/products/${row.id}`}
            style={{
              color: "var(--color-accent-text)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {title}
          </Link>
        )
      },
    },
    {
      key: "brand",
      header: fa ? "برند" : "Brand",
      render: (row) => (
        <span style={{ color: "var(--color-text-secondary)" }}>
          {fa ? row.brand.nameFa : (row.brand.nameEn || row.brand.nameFa)}
        </span>
      ),
    },
    {
      key: "cementType",
      header: fa ? "نوع سیمان" : "Cement Type",
      render: (row) => {
        const item = row.cementType ? CEMENT_TYPE_LABEL[row.cementType] : null
        return (
          <span style={{ color: "var(--color-text-secondary)" }}>
            {item ? (fa ? item.fa : item.en) : "—"}
          </span>
        )
      },
    },
    {
      key: "packagingType",
      header: fa ? "بسته‌بندی" : "Packaging",
      render: (row) => {
        const item = PACKAGING_LABEL[row.packagingType]
        return (
          <span style={{ color: "var(--color-text-secondary)" }}>
            {item ? (fa ? item.fa : item.en) : "—"}
          </span>
        )
      },
    },
    {
      key: "price",
      header: fa ? "قیمت" : "Price",
      render: (row) => (
        <InlinePriceCell
          productId={row.id}
          currentPrice={row.price}
          locale={locale}
          fa={fa}
          onPriceUpdated={(newPrice) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === row.id ? { ...p, price: newPrice } : p))
            )
          }}
        />
      ),
    },
    {
      key: "stockStatus",
      header: fa ? "موجودی" : "Stock",
      render: (row) => {
        const label = STOCK_LABEL[row.stockStatus] ?? STOCK_LABEL.OUT_OF_STOCK!
        const variant = STOCK_VARIANT[row.stockStatus] ?? "out"
        const badgeVariant =
          variant === "in" ? "active" : variant === "low" ? "draft" : "inactive"
        return (
          <StatusBadge
            variant={badgeVariant}
            label={fa ? label.fa : label.en}
          />
        )
      },
    },
    {
      key: "isActive",
      header: fa ? "وضعیت" : "Status",
      render: (row) => (
        <InlineToggle
          value={row.isActive}
          ariaLabel={row.nameFa}
          onChange={(next) => handleToggleActive(row, next)}
        />
      ),
    },
  ]

  if (isArchived) {
    columns.push({
      key: "actions",
      header: fa ? "عملیات" : "Actions",
      align: "end",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleRestore(row)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.375rem 0.75rem",
            borderRadius: "0.375rem",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          <RotateCcw style={{ width: "0.875rem", height: "0.875rem" }} />
          {fa ? "بازگردانی" : "Restore"}
        </button>
      ),
    })
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        editHref={isArchived ? undefined : (p) => `/${locale}/admin/products/${p.id}`}
        onRowAction={isArchived ? undefined : (action, row) => {
          if (action === "delete") {
            setDeleteTarget(row)
          }
        }}
        emptyIcon={Package}
        emptyTitle={fa ? "محصولی یافت نشد" : "No products found"}
        emptyDescription={
          fa
            ? "هیچ محصولی با مشخصات جستجو شده یافت نشد."
            : "No products matched your search criteria."
        }
        emptyAction={{
          label: fa ? "افزودن محصول جدید" : "Create Product",
          href: `/${locale}/admin/products/new`,
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={fa ? "حذف محصول" : "Delete Product"}
        description={
          fa
            ? `آیا از حذف محصول «${deleteTarget?.nameFa}» اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
            : `Are you sure you want to delete "${deleteTarget?.nameFa}"? This action cannot be undone.`
        }
        confirmLabel={fa ? "تأیید و حذف" : "Confirm Delete"}
        cancelLabel={fa ? "انصراف" : "Cancel"}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
