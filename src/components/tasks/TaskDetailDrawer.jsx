import React, { useEffect, useState } from 'react'
import {
  Pencil,
  Trash2,
  Calendar,
  Clock,
  FolderKanban,
  Tag,
  StickyNote,
  History,
  Send,
  ListChecks,
  ChevronDown,
  CheckCircle2,
  Circle,
  Star,
  Copy,
  Ban,
  Repeat,
  Trash
} from 'lucide-react'
import Drawer from '../ui/Drawer'
import Dropdown from '../ui/Dropdown'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import { StatusBadge, PriorityBadge, Tag as TagChip, DueDateBadge } from '../ui/Badge'
import { Textarea } from '../ui/Inputs'
import ProgressBar from '../ui/ProgressBar'
import { useStore, useTaskById, useTaskNotes } from '../../store/store'
import { STATUS, RECURRENCE } from '../../lib/constants'
import { formatDate, formatRelative } from '../../lib/format'
import { useToast } from '../../store/toast'
import { deleteTaskWithUndo } from '../../lib/utils'

function MetaRow({ icon: Icon, label, value, children }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
      <Icon size={16} className="shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          {value}
        </span>
      </span>
      {children}
    </div>
  )
}

export default function TaskDetailDrawer({ open, onClose, taskId, onEdit }) {
  const { state, dispatch } = useStore()
  const task = useTaskById(taskId)
  const notes = useTaskNotes(taskId)
  const toast = useToast()
  const [noteText, setNoteText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    setNoteText('')
    setCancelReason('')
    setCancelOpen(false)
  }, [taskId, open])

  if (!open || !task) return null

  const isDone = task.status === 'done'
  const isCancelled = task.status === 'cancelled'

  const change = (patch, msg) => {
    dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch })
    if (msg) toast.success(msg)
  }

  const toggleDone = () => {
    dispatch({ type: 'TOGGLE_TASK_DONE', taskId: task.id })
    toast.success(isDone ? 'Tarefa reaberta' : (task.recurrence && task.recurrence !== 'none') ? 'Tarefa concluída — próxima ocorrência criada' : 'Tarefa concluída')
  }

  const taskActivities = state.activities.filter((a) => a.taskId === task.id).slice(0, 8)

  const submitNote = (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    dispatch({ type: 'ADD_NOTE', taskId: task.id, text: noteText.trim() })
    setNoteText('')
    toast.success('Nota adicionada')
  }

  const removeNote = (noteId) => {
    dispatch({ type: 'DELETE_NOTE', taskId: task.id, noteId })
    toast.info('Nota removida')
  }

  const doneSubtasks = task.subtasks.filter((s) => s.done).length

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Detalhes da tarefa"
        subtitle={`Criada em ${formatDate(task.createdAt)}`}
        disableDismiss={confirmDelete || cancelOpen}
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                Excluir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Copy}
                onClick={() => {
                  dispatch({ type: 'DUPLICATE_TASK', taskId: task.id })
                  toast.success('Tarefa duplicada')
                }}
              >
                Duplicar
              </Button>
              {!isDone && !isCancelled && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Ban}
                  onClick={() => {
                    setCancelReason('')
                    setCancelOpen(true)
                  }}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Cancelar
                </Button>
              )}
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:gap-1.5">
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                Excluir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Copy}
                onClick={() => {
                  dispatch({ type: 'DUPLICATE_TASK', taskId: task.id })
                  toast.success('Tarefa duplicada')
                }}
              >
                Duplicar
              </Button>
              {!isDone && !isCancelled && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Ban}
                  onClick={() => {
                    setCancelReason('')
                    setCancelOpen(true)
                  }}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  Cancelar
                </Button>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Fechar
              </Button>
              <Button
                icon={Pencil}
                onClick={() => {
                  onEdit?.(task)
                  onClose()
                }}
              >
                Editar
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <DueDateBadge dueDate={task.dueDate} status={task.status} />
              <button
                onClick={() =>
                  dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })
                }
                className={`ml-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                  task.favorite
                    ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <Star size={13} fill={task.favorite ? 'currentColor' : 'none'} />
                {task.favorite ? 'Favorita' : 'Favoritar'}
              </button>
            </div>
            <h2 className="mt-3 text-xl font-bold leading-snug text-slate-900 dark:text-white">
              {task.title}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {task.description || 'Sem descrição.'}
            </p>
            {task.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {task.tags.map((t) => (
                  <TagChip key={t}>{t}</TagChip>
                ))}
              </div>
            )}
          </div>

          {!isCancelled && (
            <Button
              variant={isDone ? 'secondary' : 'primary'}
              icon={isDone ? undefined : CheckCircle2}
              onClick={toggleDone}
              className="w-full"
            >
              {isDone ? 'Reabrir tarefa' : 'Marcar como concluída'}
            </Button>
          )}

          {task.subtasks.length > 0 && (
            <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                  <ListChecks size={16} className="text-slate-400" />
                  Subtarefas ({doneSubtasks}/{task.subtasks.length})
                </p>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {Math.round((doneSubtasks / task.subtasks.length) * 100)}%
                </span>
              </div>
              <ProgressBar value={(doneSubtasks / task.subtasks.length) * 100} className="mt-2" />
              <div className="mt-3 space-y-1">
                {task.subtasks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      dispatch({ type: 'TOGGLE_SUBTASK', taskId: task.id, subtaskId: s.id })
                    }
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                      s.done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {s.done ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />
                    )}
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Informações
            </p>
            <div className="space-y-2">
              {task.projectId && (
                <MetaRow
                  icon={FolderKanban}
                  label="Projeto"
                  value={state.projects.find((p) => p.id === task.projectId)?.name || '—'}
                />
              )}
              {task.categoryId && (
                <MetaRow
                  icon={Tag}
                  label="Categoria"
                  value={state.categories.find((c) => c.id === task.categoryId)?.name || '—'}
                />
              )}
              {task.dueDate && (
                <MetaRow
                  icon={Calendar}
                  label="Vencimento"
                  value={formatDate(task.dueDate)}
                />
              )}
              <MetaRow
                icon={Clock}
                label="Horas estimadas"
                value={task.estimatedHours ? `${task.estimatedHours}h` : 'Não estimado'}
              />
              <MetaRow
                icon={Repeat}
                label="Repetição"
                value={
                  task.recurrence && RECURRENCE[task.recurrence]
                    ? RECURRENCE[task.recurrence].label
                    : 'Não se repete'
                }
              />
            </div>

            <Dropdown
              align="right"
              triggerClassName="w-full mt-4"
              trigger={
                <button
                  title="Alterar status"
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Alterar status
                  <ChevronDown size={15} className="text-slate-400" />
                </button>
              }
              items={Object.values(STATUS)
                .filter((s) => s.key !== 'cancelled')
                .map((s) => ({
                  label: s.label,
                  active: task.status === s.key,
                  onClick: () => {
                    if (task.status !== s.key) change({ status: s.key }, `Movida para ${s.label}`)
                  }
                }))
              }
            />

            {isCancelled && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <Ban size={14} /> Tarefa cancelada
                </p>
                {task.cancelReason && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Motivo: {task.cancelReason}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => change({ status: 'todo', cancelReason: null }, 'Tarefa reativada')}
                >
                  Reativar
                </Button>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <History size={13} /> Atividades
            </p>
            {taskActivities.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400 dark:border-slate-700">
                Nenhuma atividade registrada ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {taskActivities.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">{a.text}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                        {formatRelative(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <StickyNote size={13} /> Notas ({notes.length})
            </p>
            <div className="space-y-3">
              {notes.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400 dark:border-slate-700">
                  Anote progressos, links ou ideias sobre esta tarefa.
                </p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="group flex items-start gap-2.5">
                  <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                    <p className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">{formatRelative(n.createdAt)}</span>
                      <button
                        onClick={() => removeNote(n.id)}
                        className="rounded p-0.5 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-slate-600"
                        aria-label="Remover nota"
                      >
                        <Trash size={12} />
                      </button>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{n.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={submitNote} className="mt-4">
              <Textarea
                placeholder="Escreva uma nota..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" size="sm" icon={Send} disabled={!noteText.trim()}>
                  Adicionar nota
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Drawer>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar tarefa"
        description="O motivo é opcional — anote se quiser lembrar o porquê."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button
              onClick={() => {
                dispatch({
                  type: 'CANCEL_TASK',
                  taskId: task.id,
                  reason: cancelReason.trim() || null
                })
                toast.success('Tarefa cancelada')
                setCancelReason('')
                setCancelOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancelar tarefa
            </Button>
          </>
        }
      >
        <Textarea
          label="Motivo (opcional)"
          autoFocus
          placeholder="Ex.: Fora de escopo, duplicada, prioridade mudou..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          try {
            deleteTaskWithUndo({ dispatch, toast, task })
            onClose()
          } catch (e) { console.error('Delete failed:', e) }
        }}
        title="Excluir tarefa"
        message={`Tem certeza que deseja excluir "${task.title}"?`}
        confirmLabel="Excluir tarefa"
      />
    </>
  )
}
