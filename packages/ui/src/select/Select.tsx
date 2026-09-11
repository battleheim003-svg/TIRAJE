import * as React from "react"
import { ChevronDown } from "lucide-react"
import styles from "./Select.module.css"

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options?: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, options, placeholder, ...props }, ref) => (
    <div className={styles["ui-sel__wrapper"]}>
      <select
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        className={[styles["ui-sel__field"], className].filter(Boolean).join(" ")}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <span className={styles["ui-sel__icon"]} aria-hidden="true">
        <ChevronDown style={{ width: "1rem", height: "1rem" }} />
      </span>
    </div>
  )
)

Select.displayName = "Select"
