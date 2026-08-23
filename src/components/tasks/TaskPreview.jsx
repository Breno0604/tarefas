import React, { useRef } from 'react'
import { createPortal } from 'react-dom'
import { Star, Pencil, ListChecks, Clock } from 'lucide-react'
import { Avatar, StatusBadge, PriorityBadge, Tag as TagChip, DueDateBadge } from '../ui/Badge'
import { useDismissable } from '../../hooks/useDismissable'

const W = 300

export default function TaskPreview({
  task,
  anchorRect,
  assignee,
  project,
  commentCount,
  onClose,
  onOpen,
  onEdit,
  onToggleFavorite,
  onPointerEnter,
  onPointerLeave
}) {
  const ref = useRef(null)
  useDismissable(ref, onClose)

  let left = anchorRect.right + 10
  let top = anchorRect.top
  if (left + W > window.innerWidth - 8) {
    left = anchorRect.left - W - 10
  }
  left = Math.max(8, left)
  top = Math.max(8, top)
  if (top + 260 > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - 268)
  }

  const doneSubtasks = task.subtasks.filter((s) => s.done).length

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[75] w-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900"
      style={{ left, top }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="border-b border-slate-100 p-3.5 dark:border-slate-800">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={task.status} size="sm" />
              <PriorityBadge priority={task.priority} />
              <DueDateBadge dueDate={task.dueDate} status={task.status} />
            </div>
            <h3 className="mt-2 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100">
              {task.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {task.description || 'Sem descrição.'}
            </p>
          </div>
          <button
            onClick={onToggleFavorite}
            className={`shrink-0 rounded-md p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
              task.favorite ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
            }`}
            aria-label={task.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star size={16} fill={task.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="space-y-2 p-3.5">
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 4).map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
            <Avatar user={assignee} size="xs" />
            {assignee ? assignee.name.split(' ')[0] : 'Não atribuída'}
          </span>
          {project && (
            <span className="flex items-center gap-1.5 truncate font-medium text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="max-w-[120px] truncate">{project.name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-500">
          {task.subtasks.length > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks size={12} />
              {doneSubtasks}/{task.subtasks.length}
            </span>
          )}
          {task.estimatedHours > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {task.estimatedHours}h
            </span>
          )}
          {commentCount > 0 && <span>{commentCount} comentário(s)</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
        <button
          onClick={() => {
            onOpen()
            onClose()
          }}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
        >
          Abrir detalhes
        </button>
        <button
          onClick={() => {
            onEdit()
            onClose()
          }}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          aria-label="Editar tarefa"
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>,
    document.body
  )
}
