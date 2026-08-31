import React from 'react'
import type { LucideIcon } from 'lucide-react'

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2'
}

const ICON_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11'
}

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-300 disabled:hover:bg-brand-600',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700',
  outline:
    'border border-slate-200 bg-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 active:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-300',
  subtle:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 focus-visible:ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconOnly = false,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}: {
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconOnly?: boolean
  loading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  [key: string]: any
}): React.JSX.Element {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold outline-none transition focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50'
  const sizeClass = iconOnly ? ICON_SIZES[size] : SIZES[size]
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizeClass} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}
      {!iconOnly && children}
    </button>
  )
}
