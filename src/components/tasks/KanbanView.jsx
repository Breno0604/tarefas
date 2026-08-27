import React, { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  KeyboardSensor
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Columns3, Flag } from 'lucide-react'
import { STATUS, KANBAN_COLUMNS, PRIORITY, PRIORITY_ORDER } from '../../lib/constants'
import { useStore, validateTaskPayload } from '../../store/store'
import TaskCard from './TaskCard'
import { useToast } from '../../store/toast'
import { SegmentedControl } from '../ui/Tabs'

const GROUP_OPTIONS = [
  { key: 'status', label: 'Status', icon: Columns3 },
  { key: 'priority', label: 'Prioridade', icon: Flag }
]

function SortableTaskCard({ task, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto'
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} {...props} draggable={false} />
    </div>
  )
}

function KanbanColumn({ column, tasks, isOver, cancelled, children }) {
  return (
    <div className={`flex w-64 shrink-0 flex-col sm:w-72${cancelled ? ' opacity-50' : ''}`}>
      <div className="mb-3 flex items-center gap-2 px-1">
        {column.colorStyle ? (
          <span className="h-2.5 w-2.5 rounded-full" style={column.colorStyle} />
        ) : (
          <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        )}
        <h3 className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
          {column.label}
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          className={`flex-1 space-y-2.5 rounded-xl p-2 transition-colors ${
            isOver
              ? 'bg-brand-50 ring-2 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/40'
              : 'bg-slate-100/70 dark:bg-slate-800/40'
          }`}
        >
          {children}
          {tasks.length === 0 && !isOver && column.key !== 'cancelled' && (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
              Solte tarefas aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function KanbanView({
  tasks,
  onOpenTask,
  onEditTask,
  onChange,
  onDeleteTask,
  onToggleFavorite,
  onDuplicateTask,
  onToggleDone,
  onCancelTask
}) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [groupBy, setGroupBy] = useState('status')
  const [activeId, setActiveId] = useState(null)
  const [overColumn, setOverColumn] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor)
  )

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
    return PRIORITY_ORDER.map((key) => ({
      key,
      label: PRIORITY[key].label,
      dot: 'bg-current',
      addDefaults: { priority: key },
      patch: () => ({ priority: key }),
      colorStyle: { color: PRIORITY[key].hex }
    }))
  }, [groupBy])

  const groupOf = (t) => {
    if (groupBy === 'status') return t.status
    return t.priority
  }

  const tasksByColumn = useMemo(() => {
    const map = {}
    columns.forEach((col) => {
      map[col.key] = tasks.filter((t) => groupOf(t) === col.key)
    })
    return map
  }, [tasks, columns, groupBy])

  const columnMap = useMemo(() => {
    const map = {}
    Object.entries(tasksByColumn).forEach(([colKey, colTasks]) => {
      colTasks.forEach((t) => { map[t.id] = colKey })
    })
    return map
  }, [tasksByColumn])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const findColumn = (taskId) => columnMap[taskId] || null

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) {
      setOverColumn(null)
      return
    }

    let overCol = findColumn(over.id)

    // If hovering over a column (empty area), over.id is the column key
    if (!overCol && columns.some((c) => c.key === over.id)) {
      overCol = over.id
    }

    setOverColumn(overCol)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    setOverColumn(null)

    if (!over) return

    const activeCol = findColumn(active.id)
    let overCol = findColumn(over.id)

    if (!overCol && columns.some((c) => c.key === over.id)) {
      overCol = over.id
    }

    if (!activeCol || !overCol || activeCol === overCol) return

    const task = tasks.find((t) => t.id === active.id)
    const col = columns.find((c) => c.key === overCol)

    if (!task || !col) return

    if (groupBy === 'status' && overCol === 'cancelled') {
      toast.info('Cancelamento pede confirmação. Use o menu "…" do card.')
      return
    }

    if (groupBy === 'status' && overCol === 'done' && onToggleDone) {
      onToggleDone(task)
      return
    }

    const patch = col.patch()
    const validationErrors = validateTaskPayload(patch)
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }

    dispatch({
      type: 'UPDATE_TASK',
      taskId: active.id,
      patch
    })
    toast.success(`Tarefa movida para ${col.label}`)
  }

  const cardProps = useCallback((t) => ({
    task: t,
    project: state.projects.find((p) => p.id === t.projectId),
    noteCount: (state.notes[t.id] || []).length,
    onChange,
    onOpen: () => onOpenTask(t.id),
    onEdit: () => onEditTask(t),
    onDelete: () => onDeleteTask(t),
    onToggleFavorite: () => onToggleFavorite(t),
    onDuplicate: () => onDuplicateTask(t),
    onToggleDone,
    onCancel: onCancelTask
  }), [state.projects, state.notes, onChange, onOpenTask, onEditTask, onDeleteTask, onToggleFavorite, onDuplicateTask, onToggleDone, onCancelTask])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl size="sm" value={groupBy} onChange={setGroupBy} options={GROUP_OPTIONS} />
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Arraste tarefas entre colunas ou use o menu "…" do card
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              tasks={tasksByColumn[col.key] || []}
              isOver={overColumn === col.key}
              cancelled={col.key === 'cancelled'}
            >
              {(tasksByColumn[col.key] || []).map((t) => (
                <SortableTaskCard key={t.id} {...cardProps(t)} />
              ))}
              <button
                onClick={() => onEditTask(null, col.addDefaults)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-400 transition hover:bg-white hover:text-brand-600 hover:shadow-sm dark:hover:bg-slate-900 dark:hover:text-brand-300"
                aria-label={`Adicionar tarefa em ${col.label}`}
              >
                <Plus size={14} /> Adicionar tarefa
              </button>
            </KanbanColumn>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-64 rotate-2 opacity-90 sm:w-72">
              <TaskCard
                {...cardProps(activeTask)}
                onChange={() => {}}
                onOpen={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleFavorite={() => {}}
                onDuplicate={() => {}}
                draggable={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
