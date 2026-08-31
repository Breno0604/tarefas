import React from 'react'
import { X } from 'lucide-react'

export default function ActiveFiltersBar({ activeFilters, onRemove }: any) {
  if (activeFilters.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Filtros ativos:</span>
      {activeFilters.map((af: any) => (
        <span
          key={`${af.dim}-${af.key}`}
          className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 animate-scale-in dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
        >
          {af.label}
          <button
            onClick={() => onRemove(af)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/20"
            aria-label={`Remover filtro ${af.label}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}
