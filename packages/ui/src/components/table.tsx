import * as React from "react"
import styles from "./Table.module.css"

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles["ui-tbl__wrapper"]}>
      <table
        className={[styles["ui-tbl"], className].filter(Boolean).join(" ")}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={[styles["ui-tbl__header"], className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={[styles["ui-tbl__body"], className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={[styles["ui-tbl__row"], className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={[styles["ui-tbl__head"], className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={[styles["ui-tbl__cell"], className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={[styles["ui-tbl__caption"], className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}
