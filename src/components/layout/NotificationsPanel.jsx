import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, CalendarClock } from 'lucide-react'
import { useStore } from '../../store/store'
import { formatRelative } from '../../lib/format'
import Tooltip from '../ui/Tooltip'
import { useDismissable } from '../../hooks/useDismissable'
import EmptyState from '../ui/EmptyState'

const TYPE_ICON = {
  due: { icon: CalendarClock, cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' }
}

export default function NotificationsPanel({ open, onOpenChange }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const ref = useRef(null)
  const reminders = state.reminders || []
  const unread = reminders.filter((r) => !r.read).length
  useDismissable(ref, () => onOpenChange(false), open)

  const openTask = (reminder) => {
    dispatch({ type: 'MARK_REMINDER_READ', id: reminder.id })
    if (reminder.taskId) navigate(`/tarefas?task=${reminder.taskId}`)
    onOpenChange(false)
  }

  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Viewport-aware positioning
  useEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) return
    const position = () => {
      const trigger = triggerRef.current
      const panel = panelRef.current
      if (!trigger || !panel) return
      const tr = trigger.getBoundingClientRect()
      const pr = panel.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 8
      // Horizontal: align right edge of panel to right edge of trigger
      let left = tr.right - pr.width
      if (left < margin) left = margin
      if (left + pr.width > vw - margin) left = vw - margin - pr.width
      // Vertical: open below trigger, or above if no space
      let top = tr.bottom + 8
      if (top + pr.height > vh - margin) top = tr.top - pr.height - 8
      if (top < margin) top = margin
      setPos({ top, left })
    }
    // Run twice: once immediately to set a rough position, once after layout
    position()
    const raf = requestAnimationFrame(position)
    return () => cancelAnimationFrame(raf)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Lembretes" side="bottom">
        <button
          ref={triggerRef}
          onClick={() => onOpenChange(!open)}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Lembretes"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-[85] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Lembretes</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unread} não lido(s)
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip content="Marcar todos como lidos">
                <button
                  onClick={() => dispatch({ type: 'MARK_ALL_REMINDERS_READ' })}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Marcar todos como lidos"
                >
                  <CheckCheck size={16} />
                </button>
              </Tooltip>
              <Tooltip content="Limpar todos">
                <button
                  onClick={() => dispatch({ type: 'CLEAR_REMINDERS' })}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Limpar lembretes"
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {reminders.length === 0 ? (
              <EmptyState icon={Bell} title="Nenhum lembrete" compact />
            ) : (
              reminders.map((r) => {
                const cfg = TYPE_ICON[r.type] || TYPE_ICON.due
                const Icon = cfg.icon
                return (
                  <button
                    key={r.id}
                    onClick={() => openTask(r)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                      !r.read ? 'bg-brand-50/60 dark:bg-brand-500/5' : ''
                    }`}
                  >
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.cls}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {r.title}
                        </span>
                        {!r.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {r.body}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {formatRelative(r.createdAt)}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
