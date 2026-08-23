import React, { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useDismissable } from '../../hooks/useDismissable'

export default function Dropdown({
  trigger,
  items = [],
  align = 'left',
  className = '',
  triggerClassName = '',
  onOpenChange
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = () => setOpen(false)
  useDismissable(ref, close, open)

  const toggle = () => {
    const next = !open
    setOpen(next)
    onOpenChange?.(next)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div onClick={toggle}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-40 mt-1.5 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1 shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${triggerClassName}`}
        >
          {items.map((item, i) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={i}
                  className="my-1 border-t border-slate-100 dark:border-slate-800"
                />
              )
            }
            if (item.type === 'label') {
              return (
                <div
                  key={i}
                  className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  {item.label}
                </div>
              )
            }
            const Icon = item.icon
            return (
              <button
                key={item.label || i}
                disabled={item.disabled}
                onClick={() => {
                  if (item.keepOpen) {
                    item.onClick?.()
                  } else {
                    setOpen(false)
                    item.onClick?.()
                  }
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  item.disabled
                    ? 'cursor-not-allowed opacity-45'
                    : item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {Icon && (
                  <Icon size={16} className={item.danger ? '' : 'text-slate-400'} />
                )}
                <span className="flex-1">{item.label}</span>
                {item.active && <Check size={15} className="text-brand-600 dark:text-brand-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
