import React, { useState } from 'react'
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Star, Repeat } from 'lucide-react'
import { StatusBadge, PriorityBadge, Tag as TagChip } from '../ui/Badge'
import Dropdown from '../ui/Dropdown'
import ConfirmDialog from '../ui/ConfirmDialog'
import { Checkbox } from '../ui/Inputs'
import { useContextMenu } from '../ui/ContextMenu'
import { buildTaskMenu } from './taskMenu'
import { formatDay, isOverdue } from '../../lib/format'
import { useStore } from '../../store/store'

function SortHeader({ label, sortKey, current, onSort }) {
  const active = current && current.startsWith(sortKey)
  const dir = current === `${sortKey}_asc` ? 'asc' : current === `${sortKey}_desc` ? 'desc' : null
  const Icon = dir ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <button
      onClick={() => {
        const nextDir = dir === 'asc' ? 'desc' : 'asc'
        onSort(active ? `${sortKey}_${nextDir}` : `${sortKey}_asc`)
      }}
      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition ${
        active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
      }`}
    >
      {label}
      <Icon size={12} />
    </button>
  )
}

export default function TaskTableView({ tasks, selected, onToggleAll, onToggleSelect, onSort, sortKey, onOpenTask, onEditTask, onChange, onDeleteTask, onToggleFavorite, onDuplicateTask, onToggleDone, onCancelTask }) {
  const { state } = useStore()
  const { show } = useContextMenu()
  const [confirm, setConfirm] = useState(null)

  const allSelected = tasks.length > 0 && tasks.every((t) => selected.has(t.id))
  const someSelected = tasks.some((t) => selected.has(t.id))

  return (
    <div className="card-base overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-left dark:border-slate-800 dark:bg-slate-800/40">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  onChange={(e) => {
                    onToggleAll()
                    e.target.indeterminate = someSelected && !allSelected
                  }}
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-2 py-3">
                <SortHeader label="Título" sortKey="title" current={sortKey} onSort={onSort} />
              </th>
              <th className="px-2 py-3">
                <SortHeader label="Status" sortKey="status" current={sortKey} onSort={onSort} />
              </th>
              <th className="px-2 py-3">
                <SortHeader label="Prioridade" sortKey="priority" current={sortKey} onSort={onSort} />
              </th>
              <th className="px-2 py-3">Projeto</th>
              <th className="px-2 py-3">
                <SortHeader label="Vencimento" sortKey="dueDate" current={sortKey} onSort={onSort} />
              </th>
              <th className="w-10 px-2 py-3">
                <span className="flex items-center justify-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <Star size={12} />
                </span>
              </th>
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const project = state.projects.find((p) => p.id === task.projectId)
              const overdue = isOverdue(task.dueDate, task.status)
              const menu = buildTaskMenu(task, {
                onOpen: () => onOpenTask(task.id),
                onEdit: () => onEditTask(task),
                onDelete: () => setConfirm(task),
                onChange: (patch) => onChange(patch, task.id),
                onFavorite: () => onToggleFavorite(task),
                onDuplicate: () => onDuplicateTask(task),
                onToggleDone: onToggleDone ? () => onToggleDone(task) : undefined,
                onCancel: onCancelTask ? () => onCancelTask(task) : undefined,
                allowEdit: true,
                allowDelete: true,
                allowCreate: true
              })
              return (
                <tr
                  key={task.id}
                  onContextMenu={(e) => show(e, menu)}
                  className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-0 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(task.id)}
                      onChange={() => onToggleSelect(task.id)}
                      aria-label={`Selecionar ${task.title}`}
                    />
                  </td>
                  <td className="max-w-[260px] px-2 py-3">
                    <button
                      onClick={() => onOpenTask(task.id)}
                      className="block truncate text-left font-semibold text-slate-800 transition hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-300"
                    >
                      {task.title}
                    </button>
                    {task.tags.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {task.tags.slice(0, 2).map((t) => (
                          <TagChip key={t}>{t}</TagChip>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge status={task.status} size="sm" />
                  </td>
                  <td className="px-2 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="max-w-[140px] px-2 py-3">
                    {project ? (
                      <span className="flex items-center gap-1.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                        <span className="truncate">{project.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      <Calendar size={12} />
                      {task.dueDate ? formatDay(task.dueDate) : '—'}
                      {task.recurrence && task.recurrence !== 'none' && (
                        <Repeat size={11} className="ml-1 text-brand-500 dark:text-brand-300" aria-label="Recorrente" />
                      )}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => onToggleFavorite(task)}
                      className={`rounded-md p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        task.favorite ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                      aria-label={task.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Star size={15} fill={task.favorite ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                          aria-label="Ações da tarefa"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      }
                      items={menu}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 sm:hidden" />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          try { if (confirm) onDeleteTask(confirm) } catch (e) { console.error('Delete failed:', e) }
        }}
        title="Excluir tarefa"
        message={`Excluir "${confirm?.title}"? Você poderá desfazer em seguida.`}
      />
    </div>
  )
}
