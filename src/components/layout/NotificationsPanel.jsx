import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, UserPlus, AtSign, CalendarClock, ArrowRightCircle, MessageSquare, CheckCircle2, RotateCcw, Ban, ShieldCheck } from 'lucide-react'
import { useStore } from '../../store/store'
import { formatRelative } from '../../lib/format'
import Tooltip from '../ui/Tooltip'
import { useDismissable } from '../../hooks/useDismissable'

const TYPE_ICON = {
  assign: { icon: UserPlus, cls: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300' },
  mention: { icon: AtSign, cls: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  due: { icon: CalendarClock, cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  status: { icon: ArrowRightCircle, cls: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  comment: { icon: MessageSquare, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  approve: { icon: ShieldCheck, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  return: { icon: RotateCcw, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
  cancel: { icon: Ban, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' }
}

export default function NotificationsPanel({ open, onOpenChange }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const ref = useRef(null)
  const me = state.users.find((u) => u.id === state.currentUserId)
  const notifs = state.notifications.filter((n) => n.targetUserId === state.currentUserId)
  const unread = notifs.filter((n) => !n.read).length
  useDismissable(ref, () => onOpenChange(false), open)

  const openTask = (notif) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', id: notif.id })
    if (notif.taskId) navigate(`/tarefas?task=${notif.taskId}`)
    onOpenChange(false)
  }

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Notificações">
        <button
          onClick={() => onOpenChange(!open)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Notificações"
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
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Notificações</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Olá, {me?.name.split(' ')[0]} — {unread} não lidas
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip content="Marcar todas como lidas">
                <button
                  onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Marcar todas como lidas"
                >
                  <CheckCheck size={16} />
                </button>
              </Tooltip>
              <Tooltip content="Limpar todas">
                <button
                  onClick={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Limpar notificações"
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              notifs.map((n) => {
                const cfg = TYPE_ICON[n.type] || TYPE_ICON.status
                const Icon = cfg.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => openTask(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                      !n.read ? 'bg-brand-50/60 dark:bg-brand-500/5' : ''
                    }`}
                  >
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.cls}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {n.title}
                        </span>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {formatRelative(n.createdAt)}
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
