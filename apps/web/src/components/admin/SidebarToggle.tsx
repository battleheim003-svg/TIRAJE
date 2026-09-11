"use client"

import { Menu } from "lucide-react"

interface SidebarToggleProps {
  onToggle: () => void
  label?: string
  className?: string
}

export function SidebarToggle({ onToggle, label = "منو", className }: SidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "var(--space-2)",
        color: "var(--color-text)",
      }}
    >
      <Menu style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
    </button>
  )
}
