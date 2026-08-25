import React, { useEffect, useRef, useState } from 'react'
import { StickyNote, ListChecks, MoreHorizontal, Clock, Star, Repeat } from 'lucide-react'
import { Tag as TagChip, DueDateBadge } from '../ui/Badge'
import Dropdown from '../ui/Dropdown'
import ConfirmDialog from '../ui/ConfirmDialog'
import TaskPreview from './TaskPreview'
import { useContextMenu } from '../ui/ContextMenu'
import { buildTaskMenu } from './taskMenu'
import { RECURRENCE } from '../../lib/constants'

const PRIORITY_BAR = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-300 dark:bg-slate-600'
}

export default function TaskCard({
  task,
  project,
  noteCount,
  onChange,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onDuplicate,
  onToggleDone,
  onCancel,
  draggable = true,
  onDragStart
}) {
  const { show } = useContextMenu()
  const [confirm, setConfirm] = useState(false)
  const [preview, setPreview] = useState(null)
  const cardRef = useRef(null)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)

  useEffect(() => {
    return () => {
      clearTimeout(showTimer.current)
      clearTimeout(hideTimer.current)
    }
  }, [])

  const menu = buildTaskMenu(task, {
    onOpen,
    onEdit,
    onDelete: () => setConfirm(true),
    onChange: (patch) => onChange(patch, task.id),
    onFavorite: onToggleFavorite,
    onDuplicate,
    onToggleDone: onToggleDone ? () => onToggleDone(task) : undefined,
    onCancel: onCancel ? () => onCancel(task) : undefined,
    allowEdit: true,
    allowDelete: true,
    allowCreate: true
  })

  const queuePreview = () => {
    if (!window.matchMedia('(hover: hover)').matches) return
    clearTimeout(hideTimer.current)
    clearTimeout(showTimer.current)
    if (!preview) {
      showTimer.current = setTimeout(() => {
        const rect = cardRef.current?.getBoundingClientRect()
        if (rect) setPreview(rect)
      }, 2000)
    }
  }
  const cancelPreview = () => {
    clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => {
      setPreview(null)
    }, 500)
  }
  const keepPreview = () => {
    clearTimeout(hideTimer.current)
  }

  return (
    <>
      <div
        ref={cardRef}
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', task.id)
          onDragStart?.(task.id)
        }}
        onMouseEnter={queuePreview}
        onMouseLeave={cancelPreview}
        onContextMenu={(e) => show(e, menu)}
        className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-popover dark:border-slate-800 dark:bg-slate-900"
      >
        <div className={`h-1 w-full ${PRIORITY_BAR[task.priority]}`} />
        <div className="p-3">
          <div className="flex items-start gap-1.5">
            <button
              onClick={onOpen}
              className="flex-1 text-left text-sm font-semibold leading-snug text-slate-800 transition group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300"
            >
              {task.title}
            </button>
            <button
              onClick={onToggleFavorite}
              className={`mt-0.5 shrink-0 rounded-md p-1 transition ${
                task.favorite
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 sm:opacity-0 sm:group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-slate-800'
              }`}
              aria-label={task.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star size={14} fill={task.favorite ? 'currentColor' : 'none'} />
            </button>
            <Dropdown
              align="right"
              trigger={
                <button
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-slate-800"
                  aria-label="Ações da tarefa"
                >
                  <MoreHorizontal size={16} />
                </button>
              }
              items={menu}
            />
          </div>

          {task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((t) => (
                <TagChip key={t}>{t}</TagChip>
              ))}
            </div>
          )}

          {(task.subtasks.length > 0 || (task.recurrence && task.recurrence !== 'none')) && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {task.subtasks.length > 0 && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500"
                  aria-label={`${task.subtasks.filter((s) => s.done).length} de ${task.subtasks.length} subtarefas concluídas`}
                >
                  <ListChecks size={12} />
                  {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                </span>
              )}
              {task.recurrence && task.recurrence !== 'none' && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-medium text-brand-500 dark:text-brand-300"
                  title={`Repete ${RECURRENCE[task.recurrence]?.label?.toLowerCase() || ''}`}
                >
                  <Repeat size={12} />
                  {RECURRENCE[task.recurrence]?.label?.replace('Todo ', '').replace('Toda ', '').replace('Todos os ', '').replace('Toda semana', 'semanal').replace('Todo mês', 'mensal') || task.recurrence}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            {project ? (
              <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="truncate">{project.name}</span>
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2.5">
              {task.estimatedHours > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500" aria-label={`${task.estimatedHours} horas estimadas`}>
                  <Clock size={11} />
                  {task.estimatedHours}h
                </span>
              )}
              {noteCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500" title={`${noteCount} nota(s)`}>
                  <StickyNote size={11} />
                  {noteCount}
                </span>
              )}
              <DueDateBadge dueDate={task.dueDate} status={task.status} />
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <TaskPreview
          task={task}
          anchorRect={preview}
          project={project}
          noteCount={noteCount}
          onClose={() => setPreview(null)}
          onOpen={onOpen}
          onEdit={onEdit}
          onToggleFavorite={onToggleFavorite}
          onPointerEnter={keepPreview}
          onPointerLeave={() => {
            clearTimeout(hideTimer.current)
            hideTimer.current = setTimeout(() => setPreview(null), 500)
          }}
        />
      )}

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
