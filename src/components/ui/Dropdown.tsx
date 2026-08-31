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
}: any) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const [focusIndex, setFocusIndex] = useState(-1)
  const [menuStyle, setMenuStyle] = useState({})

  const close = useCallback(() => {
    setOpen(false)
    setFocusIndex(-1)
    setMenuStyle({})
    onOpenChange?.(false)
  }, [onOpenChange])

  useDismissable(ref, close, open)

  const toggle = () => {
    const next = !open
    setOpen(next)
    onOpenChange?.(next)
    if (next) setFocusIndex(-1)
  }

  // Viewport-aware positioning: adjust menu position after render
  useEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return
    const menu = menuRef.current
    const trigger = triggerRef.current
    const menuRect = menu?.getBoundingClientRect()
    const triggerRect = trigger?.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const MARGIN = 8 // minimum distance from viewport edge

    let left = align === 'right' ? triggerRect.right - menuRect.width : triggerRect.left
    let top = triggerRect.bottom + 6 // mt-1.5 = 6px

    // Horizontal: clamp to viewport
    if (left < MARGIN) {
      left = MARGIN
    } else if (left + menuRect.width > vw - MARGIN) {
      left = vw - menuRect.width - MARGIN
    }

    // Vertical: if menu would go below viewport, show above trigger
    if (top + menuRect.height > vh - MARGIN) {
      top = triggerRect.top - menuRect.height - 6
    }

    // Final clamp: ensure menu stays within viewport vertically
    if (top < MARGIN) top = MARGIN

    setMenuStyle({ position: 'fixed', left: `${left}px`, top: `${top}px` })
  }, [open, align])

  // Get only actionable items (not dividers or labels) for keyboard nav
  const actionableItems = items.filter(
    (item: any) => item.type !== 'divider' && item.type !== 'label' && !item.disabled
  )

  const handleItemAction = useCallback(
    (item: any) => {
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
    (e: any) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setFocusIndex((prev: any) => {
            const next = prev + 1
            return next >= actionableItems.length ? 0 : next
          })
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setFocusIndex((prev: any) => {
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
    const btns = (menuRef.current as HTMLElement).querySelectorAll('[data-menu-item]')
    ;(btns[focusIndex] as HTMLElement)?.focus()
  }, [focusIndex])

  // Focus first item when menu opens
  useEffect(() => {
    if (open && menuRef.current) {
      const buttons = menuRef.current?.querySelectorAll('[data-menu-item]')
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
          style={menuStyle}
          className={`z-40 max-w-[calc(100vw-2rem)] max-h-[260px] min-w-[160px] sm:min-w-[180px] overflow-y-auto overflow-x-hidden overscroll-contain ctx-scroll rounded-xl border border-slate-200 bg-white p-1 shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900 ${triggerClassName}`}
        >
          {items.map((item: any, i: any) => {
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
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
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
                }}                  className={`tap-feedback flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium leading-tight transition outline-none ${
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
