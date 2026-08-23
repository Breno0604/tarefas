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
  }, [])

  const hide = useCallback(() => setMenu(null), [])
  const menuRef = useRef(null)
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

  return (
    <CtxMenuContext.Provider value={{ show, hide }}>
      {children}
      {menu &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[80] min-w-[200px] rounded-xl border border-slate-200 bg-white p-1 shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900"
            style={{ left: menu.x, top: menu.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {menu.items.map((item, i) => {
              if (item.type === 'divider')
                return (
                  <div
                    key={i}
                    className="my-1 border-t border-slate-100 dark:border-slate-800"
                  />
                )
              const Icon = item.icon
              return (
                <button
                  key={item.label || i}
                  disabled={item.disabled}
                  onClick={() => {
                    hide()
                    item.onClick?.()
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-45'
                      : item.danger
                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
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
