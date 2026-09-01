import React from 'react'
import { FilePlus2, StickyNote, RefreshCw, Flag, Tag, FolderKanban, CalendarClock, Trash2, Pencil, RotateCcw, Ban } from 'lucide-react'
import { formatRelative } from '../lib/format'

const TYPE_ICON = {
  create: { icon: FilePlus2, cls: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300' },
  note: { icon: StickyNote, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  status: { icon: RefreshCw, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  priority: { icon: Flag, cls: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
  due: { icon: CalendarClock, cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  project: { icon: FolderKanban, cls: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' },
  category: { icon: Tag, cls: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300' },
  title: { icon: Pencil, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  delete: { icon: Trash2, cls: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  restore: { icon: RotateCcw, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  cancel: { icon: Ban, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' }
}

export default function ActivityFeed({ items, compact = false, onDelete }: any) {
  return (
    <ul className="space-y-1">
      {items.map((a: any) => {
        const cfg = (TYPE_ICON as any)[a.type] || TYPE_ICON.status
        const Icon = cfg.icon
        return (
          <li key={a.id} className={`group flex items-start gap-3 ${compact ? 'py-2' : 'py-2.5'}`}>
            <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.cls}`}>
              <Icon size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug text-slate-600 dark:text-slate-300">
                {a.text}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                {formatRelative(a.createdAt)}
              </span>
            </span>
            {onDelete && (
              <button
                onClick={() => onDelete(a.id)}
                className="mt-1 shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-slate-600"
                aria-label="Excluir atividade"
              >
                <Trash2 size={13} />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
