import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const [focusIndex, setFocusIndex] = useState(-1)

  const close = useCallback(() => {
    setOpen(false)
    setFocusIndex(-1)
    onOpenChange?.(false)
  }, [onOpenChange])

  useDismissable(ref, close, open)

  const toggle = () => {
    const next = !open
    setOpen(next)
    onOpenChange?.(next)
    if (next) setFocusIndex(-1)
  }

  // Get only actionable items (not dividers or labels) for keyboard nav
  const actionableItems = items.filter(
    (item) => item.type !== 'divider' && item.type !== 'label' && !item.disabled
  )

  const handleItemAction = useCallback(
    (item) => {
      if (item.keepOpen) {
        item.onClick?.()
      } else {
        close()
        item.onClick?.()
      }
    },
    [close]
  )

  // Keyboard handler on the menu panel
  const handleMenuKeyDown = useCallback(
    (e) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setFocusIndex((prev) => {
            const next = prev + 1
            return next >= actionableItems.length ? 0 : next
          })
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setFocusIndex((prev) => {
            const next = prev - 1
            return next < 0 ? actionableItems.length - 1 : next
          })
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusIndex(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusIndex(actionableItems.length - 1)
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          if (focusIndex >= 0 && focusIndex < actionableItems.length) {
            handleItemAction(actionableItems[focusIndex])
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          close()
          triggerRef.current?.focus()
          break
        }
        case 'Tab': {
          close()
          break
        }
        default:
          break
      }
    },
    [open, focusIndex, actionableItems, handleItemAction, close]
  )

  // Focus the active item when focusIndex changes
  useEffect(() => {
    if (focusIndex < 0 || !menuRef.current) return
    const buttons = menuRef.current.querySelectorAll('[data-menu-item]')
    buttons[focusIndex]?.focus()
  }, [focusIndex])

  // Focus first item when menu opens
  useEffect(() => {
    if (open && menuRef.current) {
      const buttons = menuRef.current.querySelectorAll('[data-menu-item]')
      if (buttons.length > 0) {
        setFocusIndex(0)
      }
    }
  }, [open])

  // Reset focusIndex when actionable items count changes
  useEffect(() => {
    if (focusIndex >= actionableItems.length) {
      setFocusIndex(actionableItems.length > 0 ? 0 : -1)
    }
  }, [actionableItems.length])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div ref={triggerRef} onClick={toggle}>
        {trigger}
      </div>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleMenuKeyDown}
          className={`absolute z-40 mt-1.5 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1 shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${triggerClassName}`}
        >
          {items.map((item, i) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={i}
                  role="separator"
                  className="my-1 border-t border-slate-100 dark:border-slate-800"
                />
              )
            }
            if (item.type === 'label') {
              return (
                <div
                  key={i}
                  role="presentation"
                  className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  {item.label}
                </div>
              )
            }
            const Icon = item.icon
            const isCurrentItem = actionableItems[focusIndex] === item
            return (
              <button
                key={item.label || i}
                role="menuitem"
                data-menu-item
                aria-disabled={item.disabled}
                aria-checked={item.active ? 'true' : undefined}
                tabIndex={isCurrentItem ? 0 : -1}
                disabled={item.disabled}
                onClick={() => handleItemAction(item)}
                onMouseEnter={() => {
                  const idx = actionableItems.indexOf(item)
                  if (idx >= 0) setFocusIndex(idx)
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition outline-none ${
                  item.disabled
                    ? 'cursor-not-allowed opacity-45'
                    : item.danger
                      ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10'
                      : 'text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800'
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
