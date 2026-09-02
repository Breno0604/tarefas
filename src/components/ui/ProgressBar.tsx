import React from 'react'

export default function ProgressBar({ value = 0, color, className = "" }: { value?: number; color?: string; className?: string }): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso"
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
