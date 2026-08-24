import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDismissable } from '../../hooks/useDismissable'

const CtxMenuContext = React.createContext(null)

export function useContextMenu() {
  const ctx = React.useContext(CtxMenuContext)
  if (!ctx) throw new Error('useContextMenu deve ser usado dentro de ContextMenuProvider')
  return ctx
}

export function ContextMenuProvider({ children }) {
  const [menu, setMenu] = useState(null)
  const [focusIndex, setFocusIndex] = useState(-1)
  const menuRef = useRef(null)

  const show = useCallback((e, items) => {
    e.preventDefault()
    e.stopPropagation()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const estimatedW = 220
    const estimatedH = Math.min(items.length * 36 + 8, vh)
    const x = Math.min(e.clientX, vw - estimatedW - 8)
    const y = Math.min(e.clientY, vh - estimatedH - 8)
    setMenu({ x, y, items })
    setFocusIndex(-1)
  }, [])

  const hide = useCallback(() => {
    setMenu(null)
    setFocusIndex(-1)
  }, [])

  useDismissable(menuRef, hide, Boolean(menu))

  useEffect(() => {
    if (!menu) return
    const close = () => hide()
    document.addEventListener('click', close)
    document.addEventListener('contextmenu', close)
    document.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('contextmenu', close)
      document.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menu, hide])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!menu) return
      const items = menu.items.filter((i) => i.type !== 'divider' && !i.disabled)
      if (items.length === 0) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setFocusIndex((prev) => (prev + 1) % items.length)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setFocusIndex((prev) => (prev - 1 + items.length) % items.length)
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusIndex(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusIndex(items.length - 1)
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          if (focusIndex >= 0 && focusIndex < items.length) {
            hide()
            items[focusIndex].onClick?.()
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          hide()
          break
        }
        default:
          break
      }
    },
    [menu, focusIndex, hide]
  )

  // Focus the active item when focusIndex changes
  useEffect(() => {
    if (focusIndex < 0 || !menuRef.current) return
    const buttons = menuRef.current.querySelectorAll('[data-ctx-item]')
    buttons[focusIndex]?.focus()
  }, [focusIndex])

  return (
    <CtxMenuContext.Provider value={{ show, hide }}>
      {children}
      {menu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            onKeyDown={handleKeyDown}
            className="fixed z-[80] min-w-[200px] rounded-xl border border-slate-200 bg-white p-1 shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900"
            style={{ left: menu.x, top: menu.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {menu.items.map((item, i) => {
              if (item.type === 'divider')
                return (
                  <div
                    key={i}
                    role="separator"
                    className="my-1 border-t border-slate-100 dark:border-slate-800"
                  />
                )
              const Icon = item.icon
              const actionableItems = menu.items.filter(
                (it) => it.type !== 'divider' && !it.disabled
              )
              const isCurrent = actionableItems[focusIndex] === item
              return (
                <button
                  key={item.label || i}
                  role="menuitem"
                  data-ctx-item
                  tabIndex={isCurrent ? 0 : -1}
                  disabled={item.disabled}
                  onClick={() => {
                    hide()
                    item.onClick?.()
                  }}
                  onMouseEnter={() => {
                    const idx = actionableItems.indexOf(item)
                    if (idx >= 0) setFocusIndex(idx)
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition outline-none ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-45'
                      : item.danger
                        ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus-visible:bg-red-500/10'
                        : 'text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800'
                  }`}
                >
                  {Icon && (
                    <Icon size={15} className={item.danger ? '' : 'text-slate-400'} />
                  )}
                  {item.label}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </CtxMenuContext.Provider>
  )
}
