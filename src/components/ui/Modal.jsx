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
  closeOnOverlay = true,
  fullScreen = false
}) {
  const ref = useRef(null)
  useDismissable(ref, () => onClose?.(), open && closeOnOverlay, open)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus trap: keep focus within the modal (only on Tab, not when typing in inputs)
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !ref.current) return
    // Don't trap focus when user is typing in an input/textarea
    const active = document.activeElement
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return
    const focusable = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        first.focus()
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
      if (focusable && focusable.length > 0) focusable[0].focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] flex bg-slate-900/50 backdrop-blur-sm animate-fade-in ${fullScreen ? 'flex-col p-0 sm:p-4 sm:py-10 sm:items-center sm:flex-row sm:overflow-y-auto' : 'items-start justify-center overflow-y-auto p-2 py-6 sm:p-4 sm:py-10 sm:flex-row'}`}
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className={`relative w-full ${fullScreen ? 'flex flex-col h-full max-h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl overflow-hidden' : SIZES[size] + ' sm:rounded-2xl'} rounded-none border border-slate-200 bg-white shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 dark:border-slate-800">
            <div>
              {title && (
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className={`${fullScreen ? 'min-h-0 flex-1 overflow-y-auto' : 'max-h-[85vh] sm:max-h-[calc(100vh-12rem)] overflow-y-auto'} px-4 sm:px-6 py-4 sm:py-5`}>
          {children}
        </div>
        {footer && (
          <div className={`flex items-center justify-end gap-2 border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-4 dark:border-slate-800 ${fullScreen ? 'pb-[env(safe-area-inset-bottom)]' : ''}`}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
