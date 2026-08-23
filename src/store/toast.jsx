import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

let tid = 0

const TYPES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    bar: 'bg-emerald-500'
  },
  error: {
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    bar: 'bg-red-500'
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-500',
    bar: 'bg-brand-500'
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((t2) => t2.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'success', opts = {}) => {
      const { duration = type === 'success' ? 3200 : 4200, action } =
        typeof opts === 'object' && opts !== null ? opts : { duration: opts }
      const id = ++tid
      setToasts((t) => [...t, { id, message, type, action }])
      setTimeout(() => remove(id), duration)
    },
    [remove]
  )

  const api = useMemo(
    () => ({
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
      push
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(380px,calc(100vw-40px))] flex-col gap-2">
        {toasts.map((t) => {
          const cfg = TYPES[t.type] || TYPES.info
          const Icon = cfg.icon
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pr-2 shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900"
            >
              <span className={`mt-0.5 shrink-0 ${cfg.iconClass}`}>
                <Icon size={18} />
              </span>
              <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.message}
              </p>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick?.()
                    remove(t.id)
                  }}
                  className="rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => remove(t.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Fechar notificação"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
