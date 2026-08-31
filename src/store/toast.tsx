import type { ToastItem, ToastVariant, ToastAction } from '../types'

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

type ToastInternal = ToastItem & { type: string; duration: number; action?: ToastAction }

interface ToastApi {
  success: (message: string, opts?: { action?: ToastAction; duration?: number }) => void
  error: (message: string, opts?: { action?: ToastAction; duration?: number }) => void
  info: (message: string, opts?: { action?: ToastAction; duration?: number }) => void
  push: (message: string, type?: string, opts?: { action?: ToastAction; duration?: number }) => void
}

interface ToastContextValue extends ToastApi {}

interface ToastItemProps {
  toast: ToastInternal
  onRemove: (id: string | number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let tid = 0

const TYPES = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-500' },
  error: { icon: AlertTriangle, iconClass: 'text-red-500' },
  info: { icon: Info, iconClass: 'text-brand-500' }
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const cfg = (TYPES as Record<string, typeof TYPES.success>)[toast.type] || TYPES.info
  const Icon = cfg.icon
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remainingRef = useRef<number>(toast.duration)
  const startTimeRef = useRef<number>(Date.now())

  const pause = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    remainingRef.current -= Date.now() - startTimeRef.current
  }, [])

  const resume = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => onRemove(toast.id), remainingRef.current) as unknown as ReturnType<typeof setTimeout>
  }, [toast.id, onRemove])

  // Start timer on mount
  React.useEffect(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => onRemove(toast.id), remainingRef.current) as unknown as ReturnType<typeof setTimeout>
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [toast.id, onRemove])

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pr-2 shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <span className={`mt-0.5 shrink-0 ${cfg.iconClass}`}>
        <Icon size={18} />
      </span>
      <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {toast.message}
      </p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick?.()
            onRemove(toast.id)
          }}
          className="rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onRemove(toast.id)}
        className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastInternal[]>([])

  const remove = useCallback((id: string | number) => {
    setToasts((t) => t.filter((t2) => t2.id !== id))
  }, [])

  const push = useCallback(
    (message: string, type: string = "success", opts: { action?: ToastAction; duration?: number } = {}) => {
      const { duration, action } =
        typeof opts === 'object' && opts !== null ? opts : { duration: opts }

      // Undo toasts get 10s, success gets 3.2s, others 4.2s
      const effectiveDuration = duration ?? (action ? 10000 : type === 'success' ? 3200 : 4200)

      const id = String(++tid)
      const variant: ToastVariant = (type as ToastVariant) || 'info'
      setToasts((t) => [...t, { id, message, variant, type, action, duration: effectiveDuration }])
    },
    []
  )

  const api = useMemo(
    (): ToastApi => ({
      success: (m: string, opts?: { action?: ToastAction; duration?: number }) => push(m, "success", opts),
      error: (m: string, opts?: { action?: ToastAction; duration?: number }) => push(m, "error", opts),
      info: (m: string, opts?: { action?: ToastAction; duration?: number }) => push(m, "info", opts),
      push
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(380px,calc(100vw-40px))] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
