import React from "react"
import { getLocale } from "next-intl/server"
import { db } from "@tirajeh/database"
import type { Metadata } from "next"
import { ShieldCheck, Users, Key } from "lucide-react"
import styles from "@/components/admin/AdminCommon.module.css"

export const metadata: Metadata = {
  title: "نقش‌ها و دسترسی‌ها | پنل مدیریت تیراژه",
}

export default async function AdminRolesPage() {
  const locale = await getLocale()
  const fa = locale === "fa"

  const [roles, allPermissionsCount] = await Promise.all([
    db.role.findMany({
      orderBy: { isSystem: "desc" },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
          orderBy: [
            { permission: { resource: "asc" } },
            { permission: { action: "asc" } },
          ],
        },
        _count: {
          select: { users: true },
        },
      },
    }),
    db.permission.count(),
  ])

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {fa ? "نقش‌ها و مجوزهای دسترسی" : "Roles & Permissions"}
          </h1>
          <p className={styles.subtitle}>
            {fa
              ? `مشاهده تفکیک دسترسی‌های سیستمی بر اساس نقش (${roles.length} نقش، ${allPermissionsCount} مجوز ثبت‌شده)`
              : `View access rights and privileges grouped by system role (${roles.length} roles, ${allPermissionsCount} permissions)`}
          </p>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)" }}>
        {roles.map((role) => (
          <div key={role.id} className={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{ padding: "var(--space-2)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-border-subtle)", color: "var(--color-accent-text)" }}>
                  <ShieldCheck style={{ width: "1.25rem", height: "1.25rem" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: 800, margin: 0 }}>
                      {role.displayName}
                    </h2>
                    <span style={{ fontSize: "var(--font-size-xs)", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", backgroundColor: "var(--color-border-subtle)", paddingBlock: "2px", paddingInline: "var(--space-1-5)", borderRadius: "var(--radius-sm)" }}>
                      {role.name}
                    </span>
                    {role.isSystem && (
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-accent-text)", fontWeight: 600 }}>
                        {fa ? "سیستمی" : "System"}
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "var(--space-1) 0 0 0" }}>
                      {role.description}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                  <Users style={{ width: "1rem", height: "1rem" }} />
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {role._count.users} {fa ? "کاربر" : "users"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                  <Key style={{ width: "1rem", height: "1rem" }} />
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {role.rolePermissions.length} {fa ? "مجوز" : "permissions"}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges of Permissions */}
            <div>
              <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "var(--space-2)" }}>
                {fa ? "مجوزهای مجاز:" : "Granted Permissions:"}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1-5)" }}>
                {role.rolePermissions.map((rp) => (
                  <span
                    key={rp.permissionId}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-1)",
                      fontSize: "var(--font-size-xs)",
                      fontFamily: "var(--font-mono)",
                      paddingBlock: "var(--space-1)",
                      paddingInline: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text)",
                    }}
                  >
                    <span>{rp.permission.resource}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>:</span>
                    <span style={{ color: "var(--color-accent-text)", fontWeight: 600 }}>{rp.permission.action}</span>
                  </span>
                ))}
                {role.rolePermissions.length === 0 && (
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    {fa ? "هیچ مجوزی تعریف نشده است" : "No permissions granted"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
