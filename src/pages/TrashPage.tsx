import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, RotateCcw, AlertTriangle, Inbox } from 'lucide-react'
import { useStore } from '../store/store'
import { useToast } from '../store/toast'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import { StatusBadge } from '../components/ui/Badge'
import { formatDate, formatRelative } from '../lib/format'
import { PRIORITY } from '../lib/constants'

function TrashItem({ entry, onRestore, projects }: any) {
  const { task, notes } = entry
  const project = projects.find((p: any) => p.id === task.projectId)

  return (
    <li className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-800/40">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: (PRIORITY as any)[task.priority]?.hex || '#94a3b8' }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          {project && (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate">{project.name}</span>
            </>
          )}
          {task.dueDate && <span>{formatDate(task.dueDate)}</span>}
          <span>·</span>
          <span>{notes?.length || 0} nota(s)</span>
          <span>·</span>
          <span>{formatRelative(task.createdAt)}</span>
        </div>
      </div>
      <StatusBadge status={task.status} size="sm" />
      <Button
        variant="ghost"
        size="sm"
        icon={RotateCcw}
        onClick={() => onRestore(task.id)}
      >
        Restaurar
      </Button>
    </li>
  )
}

function TrashPage() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [confirmClear, setConfirmClear] = useState(false)

  const trash = state.trash || []

  const restoreTask = (taskId: any) => {
    dispatch({ type: 'RESTORE_TASK', taskId })
    const entry = trash.find((e) => e.task.id === taskId)
    toast.success(
      entry
        ? `Tarefa "${entry.task.title}" restaurada`
        : 'Tarefa restaurada'
    )
  }

  const restoreAll = () => {
    const ids = trash.map((e) => e.task.id)
    dispatch({ type: 'RESTORE_TASK', taskId: "", taskIds: ids })
    toast.success(`${ids.length} tarefa(s) restaurada(s)`)
  }

  const clearTrash = () => {
    dispatch({ type: 'CLEAR_TRASH' })
    toast.success('Lixeira esvaziada')
    setConfirmClear(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {trash.length} tarefa(s) excluída(s)
        </p>
        {trash.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={restoreAll}>
              Restaurar todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => setConfirmClear(true)}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Limpar
            </Button>
          </div>
        )}
      </div>

      {trash.length === 0 ? (
        <div className="card-base">
          <EmptyState
            icon={Inbox}
            title="Lixeira vazia"
            description="Nenhuma tarefa foi excluída ainda. As tarefas excluídas aparecem aqui por 30 dias."
          />
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              As tarefas restauradas voltam com o status anterior
            </p>
          </div>
          <ul>
            {trash.map((entry: any) => (
              <TrashItem
                key={entry.task.id}
                entry={entry}
                onRestore={restoreTask}
                projects={state.projects}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="card-base border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Sobre a lixeira
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              As tarefas excluídas ficam aqui para restauração. Use "Restaurar" para devolvê-las.
              As tarefas restauradas voltam com o status anterior.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearTrash}
        title="Limpar lixeira"
        message="Todas as tarefas na lixeira serão excluídas permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Esvaziar lixeira"
        confirmVariant="primary"
      />
    </div>
  )
}

export default React.memo(TrashPage)
