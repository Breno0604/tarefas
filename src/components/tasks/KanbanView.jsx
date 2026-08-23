import React, { useMemo, useState } from 'react'
import { Plus, Columns3, UserRound, Flag } from 'lucide-react'
import { STATUS, KANBAN_COLUMNS, PRIORITY, PRIORITY_ORDER } from '../../lib/constants'
import { useStore, useCan, useCanModifyTask } from '../../store/store'
import TaskCard from './TaskCard'
import { useToast } from '../../store/toast'
import { SegmentedControl } from '../ui/Tabs'

const GROUP_OPTIONS = [
  { key: 'status', label: 'Status', icon: Columns3 },
  { key: 'assignee', label: 'Responsável', icon: UserRound },
  { key: 'priority', label: 'Prioridade', icon: Flag }
]

export default function KanbanView({
  tasks,
  onOpenTask,
  onEditTask,
  onChange,
  onDeleteTask,
  onToggleFavorite,
  onDuplicateTask,
  onApproveTask,
  onCancelTask
}) {
  const { state, dispatch } = useStore()
  const can = useCan()
  const canModify = useCanModifyTask()
  const toast = useToast()
  const canEdit = can('edit_tasks')
  const canCreate = can('create_tasks')
  const [groupBy, setGroupBy] = useState('status')
  const [dragOver, setDragOver] = useState(null)
  const [draggingId, setDraggingId] = useState(null)

  const columns = useMemo(() => {
    if (groupBy === 'status') {
      return KANBAN_COLUMNS.map((key) => {
        const cfg = STATUS[key]
        return {
          key,
          label: cfg.label,
          dot: cfg.dot,
          addDefaults: { status: key },
          patch: () => ({ status: key }),
          colorStyle: undefined
        }
      })
    }
    if (groupBy === 'assignee') {
      return [
        ...state.users.map((u) => ({
          key: u.id,
          label: u.name.split(' ')[0],
          dot: u.color,
          addDefaults: { assigneeId: u.id },
          patch: () => ({ assigneeId: u.id }),
          colorStyle: { backgroundColor: u.color }
        })),
        {
          key: 'none',
          label: 'Não atribuída',
          dot: '#94a3b8',
          addDefaults: { assigneeId: null },
          patch: () => ({ assigneeId: null }),
          colorStyle: undefined
        }
      ]
    }
    return PRIORITY_ORDER.map((key) => ({
      key,
      label: PRIORITY[key].label,
      dot: 'bg-current',
      addDefaults: { priority: key },
      patch: () => ({ priority: key }),
      colorStyle: { color: PRIORITY[key].hex }
    }))
  }, [groupBy, state.users])

  const groupOf = (t) => {
    if (groupBy === 'status') return t.status
    if (groupBy === 'assignee') return t.assigneeId || 'none'
    return t.priority
  }

  const handleDrop = (e, groupKey) => {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData('text/plain') || draggingId
    const task = tasks.find((t) => t.id === id)
    const col = columns.find((c) => c.key === groupKey)
    if (groupBy === 'status' && groupKey === 'cancelled') {
      toast.info('Cancelamento exige motivo. Use o menu "…" do card.')
      return
    }
    if (task && col && groupOf(task) !== groupKey) {
      if (!canEdit || !canModify(task)) {
        toast.error('Você não pode editar esta tarefa.')
        return
      }
      const patch = col.patch()
      dispatch({
        type: 'UPDATE_TASK',
        taskId: id,
        patch,
        actorId: state.currentUserId
      })
      toast.success(`Tarefa movida para ${col.label}`)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl size="sm" value={groupBy} onChange={setGroupBy} options={GROUP_OPTIONS} />
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Arraste tarefas entre colunas ou use o menu “…” do card para mover
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => groupOf(t) === col.key)
          return (
            <div key={col.key} className="flex w-72 shrink-0 flex-col">
              <div className="mb-3 flex items-center gap-2 px-1">
                {groupBy === 'priority' ? (
                  <span className="h-2.5 w-2.5 rounded-full" style={col.colorStyle} />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                )}
                <h3 className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                  {col.label}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {colTasks.length}
                </span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(col.key)
                }}
                onDragLeave={() => setDragOver((k) => (k === col.key ? null : k))}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`flex-1 space-y-2.5 rounded-xl p-2 transition-colors ${
                  dragOver === col.key
                    ? 'bg-brand-50 ring-2 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/40'
                    : 'bg-slate-100/70 dark:bg-slate-800/40'
                }`}
              >
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    assignee={state.users.find((u) => u.id === t.assigneeId)}
                    project={state.projects.find((p) => p.id === t.projectId)}
                    commentCount={(state.comments[t.id] || []).length}
                    onChange={onChange}
                    onOpen={() => onOpenTask(t.id)}
                    onEdit={() => onEditTask(t)}
                    onDelete={() => onDeleteTask(t)}
                    onToggleFavorite={() => onToggleFavorite(t)}
                    onDuplicate={() => onDuplicateTask(t)}
                    onApprove={onApproveTask}
                    onCancel={onCancelTask}
                    onDragStart={(id) => setDraggingId(id)}
                    draggable={canEdit && canModify(t)}
                  />
                ))}
                {colTasks.length === 0 && dragOver !== col.key && col.key !== 'cancelled' && (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    Solte tarefas aqui
                  </div>
                )}
                {canCreate && (
                  <button
                    onClick={() => onEditTask(null, col.addDefaults)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-400 transition hover:bg-white hover:text-brand-600 hover:shadow-sm dark:hover:bg-slate-900 dark:hover:text-brand-300"
                  >
                    <Plus size={14} /> Adicionar tarefa
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
