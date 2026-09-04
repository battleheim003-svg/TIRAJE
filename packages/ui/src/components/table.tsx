import * as React from "react"
import { cn } from "../lib/utils"

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]", className)}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-[var(--color-border)]", className)} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors",
        className
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-start text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider",
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 text-sm text-[var(--color-text)] align-middle", className)}
      {...props}
    />
  )
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn("mt-4 text-sm text-[var(--color-text-muted)]", className)}
      {...props}
    />
  )
}
