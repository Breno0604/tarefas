import React from 'react'

export function SegmentedControl({ options, value, onChange, size = 'md' }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
      {options.map((opt) => {
        const active = opt.key === value
        const Icon = opt.icon
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            title={opt.label}
            className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition ${
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            } ${
              active
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {Icon && <Icon size={14} />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
      {tabs.map((t) => {
        const isActive = t.key === active
        const Icon = t.icon
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {Icon && <Icon size={15} />}
            {t.label}
            {t.count != null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
