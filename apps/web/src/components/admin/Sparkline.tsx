import React from "react"

interface SparklineProps {
  data: number[]           // مقادیر خام (نرمال‌سازی داخلی)
  width?: number           // پیش‌فرض 80
  height?: number          // پیش‌فرض 28
  color?: string           // پیش‌فرض var(--color-accent)
  fill?: boolean           // سطح زیر خط رنگی باشد
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = "var(--color-accent)",
  fill = false,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <svg
        role="img"
        aria-label="نمودار روند خالی"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="2 2"
          opacity={0.4}
        />
      </svg>
    )
  }

  if (data.length === 1) {
    return (
      <svg
        role="img"
        aria-label="نمودار روند تک‌نقطه"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const paddingY = 3
  const effectiveHeight = height - paddingY * 2

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - paddingY - ((val - min) / range) * effectiveHeight
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  })

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`
  }, "")

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`

  return (
    <svg
      role="img"
      aria-label="نمودار روند شاخص"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {fill && (
        <path
          d={fillD}
          fill={color}
          opacity={0.12}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
