import React, { useState } from 'react'
import { StickyNote, MoreHorizontal, Calendar, Star, Repeat } from 'lucide-react'
import { StatusBadge, PriorityBadge, Tag as TagChip, DueDateBadge } from '../ui/Badge'
import Dropdown from '../ui/Dropdown'
import ConfirmDialog from '../ui/ConfirmDialog'
import { Checkbox } from '../ui/Inputs'
import { useContextMenu } from '../ui/ContextMenu'
import { buildTaskMenu } from './taskMenu'
import { PRIORITY } from '../../lib/constants'
import { formatDay, isOverdue } from '../../lib/format'

export default function TaskListItem({ task, project, noteCount, selected, onToggleSelect, onChange, onOpen, onEdit, onDelete, onToggleFavorite, onDuplicate, onToggleDone, onCancel }: any) {
  const { show } = useContextMenu()
  const [confirm, setConfirm] = useState(false)

  const menu = buildTaskMenu(task, {
    onOpen,
    onEdit,
    onDelete: () => setConfirm(true),
    onChange: (patch: any) => onChange(patch, task.id),
    onFavorite: onToggleFavorite,
    onDuplicate,
    onToggleDone: onToggleDone ? () => onToggleDone(task) : undefined,
    onCancel: onCancel ? () => onCancel(task) : undefined,
    allowEdit: true,
    allowDelete: true,
    allowCreate: true
  })

  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <>
      <div
        onContextMenu={(e) => show(e, menu)}
        className="group flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
      >
        <Checkbox
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${task.title}`}
        />
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: (PRIORITY as any)[task.priority]?.hex || '#94a3b8' }} />
        <button
          onClick={onToggleFavorite}
          className={`tap-feedback shrink-0 rounded-md p-1.5 transition ${
            task.favorite
              ? 'text-amber-400 hover:text-amber-500'
              : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 sm:opacity-0 sm:group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-slate-800'
          }`}
          aria-label={task.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Star size={15} fill={task.favorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={onOpen}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-slate-800 transition hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-300"
        >
          {task.title}
        </button>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <StatusBadge status={task.status} size="sm" />
          <PriorityBadge priority={task.priority} />
        </div>

        {task.recurrence && task.recurrence !== 'none' && (
          <span className="hidden items-center gap-1 text-xs font-medium text-brand-500 dark:text-brand-300 lg:flex" title="Tarefa recorrente">
            <Repeat size={12} />
          </span>
        )}

        <span className="hidden shrink-0 w-40 items-center gap-1.5 truncate text-xs font-medium text-slate-500 lg:flex dark:text-slate-400">
          {project ? (
            <>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="truncate">{project.name}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Sem projeto</span>
          )}
        </span>

        {task.tags.length > 0 && (
          <span className="hidden xl:block">
            <TagChip>{task.tags[0]}</TagChip>
          </span>
        )}

        <span className={`hidden w-24 items-center gap-1 text-xs font-medium sm:flex ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <Calendar size={12} />
          {task.dueDate ? formatDay(task.dueDate) : '—'}
        </span>

        {noteCount > 0 && (
          <span className="hidden items-center gap-1 text-xs font-medium text-slate-400 sm:flex dark:text-slate-500" title={`${noteCount} nota(s)`}>
            <StickyNote size={12} />
            {noteCount}
          </span>
        )}
        <DueDateBadge dueDate={task.dueDate} status={task.status} className="sm:hidden" />

        <Dropdown
          align="right"
          trigger={
            <button
              className="tap-feedback rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-slate-800"
              aria-label="Ações da tarefa"
            >
              <MoreHorizontal size={16} />
            </button>
          }
          items={menu}
        />
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false)
          try { onDelete() } catch (e) { console.error('Delete failed:', e) }
        }}
        title="Excluir tarefa"
        message={`Excluir "${task.title}"? Você poderá desfazer em seguida.`}
      />
    </>
  )
}
