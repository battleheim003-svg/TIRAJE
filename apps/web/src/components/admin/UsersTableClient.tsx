"use client"

import React, { useState } from "react"
import { Users as UsersIcon, RotateCcw } from "lucide-react"
import { DataTable, Column, InlineToggle } from "./DataTable"
import { ConfirmDialog } from "./ConfirmDialog"
import { useToast } from "./Toast"
import { formatRelativeFa } from "@tirajeh/shared"
import {
  adminToggleUserStatusAction,
  adminDeleteUserAction,
  adminRestoreUserAction,
} from "@/actions/admin-users"

export interface UserRow {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  customerType: string
  isActive: boolean
  createdAt: Date | string
  archivedAt?: Date | string | null
  role: { name: string; displayName: string } | null
}

interface UsersTableClientProps {
  users: UserRow[]
  locale: string
  fa: boolean
  isArchived?: boolean
}

const CUSTOMER_TYPE_LABEL: Record<string, { fa: string; en: string }> = {
  NORMAL:     { fa: "عادی",      en: "Normal"     },
  CONTRACTOR: { fa: "پیمانکار",  en: "Contractor" },
  COMPANY:    { fa: "شرکت",      en: "Company"    },
}

export function UsersTableClient({
  users: initialUsers,
  locale,
  fa,
  isArchived = false,
}: UsersTableClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const handleToggleActive = async (user: UserRow, nextVal: boolean) => {
    try {
      const res = await adminToggleUserStatusAction(user.id, nextVal)
      if ("error" in res && res.error) {
        toast.error(res.error)
        return
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: nextVal } : u))
      )
      toast.success(
        nextVal
          ? fa
            ? "کاربر فعال شد"
            : "User activated"
          : fa
          ? "کاربر غیرفعال شد"
          : "User deactivated"
      )
    } catch {
      toast.error(fa ? "خطا در تغییر وضعیت کاربر" : "Failed to toggle user status")
      throw new Error("Failed to toggle status")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await adminDeleteUserAction(deleteTarget.id)
      if ("error" in res && res.error) {
        toast.error(res.error)
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      toast.success(fa ? "کاربر حذف شد" : "User deleted")
      setDeleteTarget(null)
    } catch {
      toast.error(fa ? "خطا در حذف کاربر" : "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: fa ? "نام" : "Name",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
          {row.name || (fa ? "بدون نام" : "Unnamed")}
        </span>
      ),
    },
    {
      key: "contact",
      header: fa ? "ایمیل / تلفن" : "Email / Phone",
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem", fontSize: "0.8125rem" }}>
          {row.email && (
            <span style={{ color: "var(--color-text-secondary)" }}>{row.email}</span>
          )}
          {row.phone && (
            <span style={{ color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {row.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: fa ? "نقش" : "Role",
      render: (row) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.2rem 0.5rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-border-subtle)",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          {row.role?.displayName ?? row.role?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "customerType",
      header: fa ? "نوع مشتری" : "Customer Type",
      render: (row) => {
        const typeInfo = CUSTOMER_TYPE_LABEL[row.customerType] ?? {
          fa: row.customerType,
          en: row.customerType,
        }
        return (
          <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>
            {fa ? typeInfo.fa : typeInfo.en}
          </span>
        )
      },
    },
    {
      key: "isActive",
      header: fa ? "وضعیت فعال" : "Active",
      render: (row) => (
        <InlineToggle
          value={row.isActive}
          ariaLabel={row.name ?? row.email ?? "User"}
          onChange={(next) => handleToggleActive(row, next)}
        />
      ),
    },
    {
      key: "createdAt",
      header: fa ? "تاریخ عضویت" : "Joined",
      render: (row) => (
        <span style={{ color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem" }}>
          {formatRelativeFa(row.createdAt)}
        </span>
      ),
    },
  ]

  const handleRestoreUser = async (user: UserRow) => {
    try {
      const res = await adminRestoreUserAction(user.id)
      if ("error" in res && res.error) {
        toast.error(res.error)
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      toast.success(fa ? "کاربر با موفقیت بازگردانی شد" : "User restored successfully")
    } catch {
      toast.error(fa ? "خطا در بازگردانی کاربر" : "Failed to restore user")
    }
  }

  if (isArchived) {
    columns.push({
      key: "actions",
      header: fa ? "عملیات" : "Actions",
      align: "end",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleRestoreUser(row)}
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
        data={users}
        keyExtractor={(u) => u.id}
        onRowAction={isArchived ? undefined : (action, row) => {
          if (action === "delete") {
            setDeleteTarget(row)
          }
        }}
        emptyIcon={UsersIcon}
        emptyTitle={fa ? "کاربری یافت نشد" : "No users found"}
        emptyDescription={
          fa
            ? "هیچ کاربری با عبارت جستجو شده مطابقت ندارد."
            : "No users matched your search criteria."
        }
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={fa ? "حذف کاربر" : "Delete User"}
        description={
          fa
            ? `آیا از حذف کاربر «${deleteTarget?.name ?? deleteTarget?.email}» اطمینان دارید؟`
            : `Are you sure you want to delete "${deleteTarget?.name ?? deleteTarget?.email}"?`
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
