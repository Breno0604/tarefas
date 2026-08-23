import React from 'react'
import { FilePlus2, UserPlus, MessageSquare, RefreshCw, Flag, Tag, FolderKanban, CalendarClock, Trash2, Pencil, Shield, RotateCcw, Users, ShieldCheck, Ban } from 'lucide-react'
import { Avatar } from './ui/Badge'
import { formatRelative } from '../lib/format'
import { useStore } from '../store/store'

const TYPE_ICON = {
  create: { icon: FilePlus2, cls: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300' },
  assign: { icon: UserPlus, cls: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  comment: { icon: MessageSquare, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  status: { icon: RefreshCw, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  priority: { icon: Flag, cls: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
  due: { icon: CalendarClock, cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  project: { icon: FolderKanban, cls: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' },
  category: { icon: Tag, cls: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300' },
  title: { icon: Pencil, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  delete: { icon: Trash2, cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  profile: { icon: Shield, cls: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
  restore: { icon: RotateCcw, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  team: { icon: Users, cls: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  approve: { icon: ShieldCheck, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  return: { icon: RotateCcw, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
  cancel: { icon: Ban, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' }
}

export default function ActivityFeed({ items, compact = false }) {
  const { state } = useStore()
  return (
    <ul className="space-y-1">
      {items.map((a) => {
        const actor = state.users.find((u) => u.id === a.actorId)
        const cfg = TYPE_ICON[a.type] || TYPE_ICON.status
        const Icon = cfg.icon
        return (
          <li key={a.id} className={`flex items-start gap-3 ${compact ? 'py-2' : 'py-2.5'}`}>
            <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.cls}`}>
              <Icon size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug text-slate-600 dark:text-slate-300">
                {a.text}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Avatar user={actor} size="xs" />
                {formatRelative(a.createdAt)}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
