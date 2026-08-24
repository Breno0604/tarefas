import React from 'react'
import { Box } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Box,
  title,
  description,
  action,
  compact = false
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-16'
      }`}
    >
      <span className="relative mb-4 inline-flex">
        {/* Decorative ring behind icon */}
        <span className="absolute inset-0 -m-2 rounded-3xl bg-slate-100/60 dark:bg-slate-800/40" />
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Icon size={26} />
        </span>
      </span>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
