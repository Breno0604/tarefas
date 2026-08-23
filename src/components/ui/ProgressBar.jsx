import React from 'react'

export default function ProgressBar({ value = 0, color, className = '' }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${clamped}%`,
          backgroundColor: color || (clamped >= 100 ? '#10b981' : '#6366f1')
        }}
      />
    </div>
  )
}
