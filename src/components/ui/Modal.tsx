import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useDismissable } from '../../hooks/useDismissable'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  fullScreen = false,
  closeOnOverlay = true,
  className = ''
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullScreen?: boolean
  closeOnOverlay?: boolean
  className?: string
}): React.ReactElement | null {
  const ref = useRef<HTMLDivElement | null>(null)
  useDismissable(ref, () => onClose?.(), open)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus trap: keep focus within the modal (only on Tab, not when typing in inputs)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !ref.current) return
    // Don't trap focus when user is typing in an input/textarea
    const active = document.activeElement
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return
    const focusable = ref.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault()
        if (last) (last as HTMLElement).focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        if (first) (first as HTMLElement).focus()
      }
    }
  }, [])

  // Auto-focus first input/textarea when modal opens (skip on touch devices to avoid keyboard popup)
  useEffect(() => {
    if (!open || !ref.current) return
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return // Don't auto-focus on touch to avoid keyboard interference
    const timer = setTimeout(() => {
      const focusable = ref.current?.querySelectorAll(
        'input:not([type="hidden"]), textarea, select'
      )
      if (focusable && (focusable as any).length > 0) (focusable[0] as HTMLElement)?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] flex bg-slate-900/50 backdrop-blur-sm animate-fade-in ${fullScreen ? 'flex-col p-0 sm:p-4 sm:py-10 sm:items-center sm:flex-row sm:overflow-y-auto' : 'items-start justify-center overflow-y-auto p-2 py-6 sm:p-4 sm:py-10 sm:flex-row'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget && closeOnOverlay) onClose() }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal
        aria-label={title}
        className={`relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-popover dark:bg-slate-900 ${(SIZES as any)[size] || SIZES.md}`}
      >
        {(title || description) && (
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            {title && <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}