import React from "react"
import styles from "./SkeletonRow.module.css"

interface SkeletonRowProps {
  columnsCount?: number
  rowsCount?: number
}

export function SkeletonRow({ columnsCount = 5, rowsCount = 5 }: SkeletonRowProps) {
  const rows = Array.from({ length: rowsCount })
  const cols = Array.from({ length: columnsCount })

  return (
    <>
      {rows.map((_, rIdx) => (
        <tr key={rIdx} className={styles.skRow}>
          {cols.map((_, cIdx) => {
            const lengthClass =
              cIdx === 0
                ? styles.skBoxLong
                : cIdx % 2 === 0
                ? styles.skBoxShort
                : styles.skBoxMedium
            return (
              <td key={cIdx} className={styles.skCell}>
                <div className={`${styles.skBox} ${lengthClass}`} />
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
