import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pageCount, total, onChange, pageSize }) {
  if (pageCount <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-sm">
      <p className="text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{from}–{to}</span>{' '}
        de {total} tarefas
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pageCount }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => (
            <React.Fragment key={p}>
              {idx > 0 && arr[idx - 1] !== p - 1 && (
                <span className="px-1 text-slate-400">…</span>
              )}
              <button
                onClick={() => onChange(p)}
                className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold transition ${
                  p === page
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            </React.Fragment>
          ))}
        <button
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Próxima página"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
