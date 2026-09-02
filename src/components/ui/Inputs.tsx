import React from 'react'
import { ChevronDown } from 'lucide-react'

export function Input({ label, hint, error, icon: Icon, className = '', ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={16} />
          </span>
        )}
        <input
          className={`input-base ${Icon ? 'pl-9' : ''} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function Textarea({ label, hint, className = '', ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <textarea className={`input-base min-h-[100px] resize-y ${className}`} {...props} />
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

export function Select({ label, hint, options = [], placeholder, className = '', ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <div className="relative">
        <select className={`input-base appearance-none pr-9 ${className}`} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o: any) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown size={15} />
        </span>
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

export function Checkbox({ label, className = '', ...props }: any) {
  return (
    <label className={`inline-flex cursor-pointer select-none items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-500"
        {...props}
      />
      {label && <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>}
    </label>
  )
}

export function Switch({ checked, onChange, label, description, disabled = false }: any) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span onClick={() => !disabled && onChange(!checked)}>
        {label && (
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            {label}
          </span>
        )}
        {description && (
          <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-[26px] w-[48px] shrink-0 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
          checked
            ? 'bg-brand-600 shadow-inner hover:bg-brand-700 active:bg-brand-800'
            : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-500 dark:hover:bg-slate-400'
        } ${disabled ? 'pointer-events-none' : ''}`}
      >
        <span
          className={`absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-[22px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export function Field({ label, children, hint }: any) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}
