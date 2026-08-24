import React, { useEffect, useState } from 'react'
import {
  Pencil,
  Trash2,
  Calendar,
  Clock,
  User,
  FolderKanban,
  Tag,
  MessageSquare,
  History,
  Send,
  ListChecks,
  ChevronDown,
  CheckCircle2,
  Circle,
  Star,
  Copy,
  RotateCcw,
  Ban,
  ShieldCheck
} from 'lucide-react'
import Drawer from '../ui/Drawer'
import Dropdown from '../ui/Dropdown'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import { Avatar, StatusBadge, PriorityBadge, Tag as TagChip, DueDateBadge } from '../ui/Badge'
import { Textarea } from '../ui/Inputs'
import ProgressBar from '../ui/ProgressBar'
import { useStore, useTaskById, useTaskComments, useCurrentUser, useCan, useCanReassign, useCanModifyTask } from '../../store/store'
import { STATUS, PRIORITY } from '../../lib/constants'
import { formatDate, formatRelative } from '../../lib/format'
import { useToast } from '../../store/toast'
import { deleteTaskWithUndo } from '../../lib/utils'
import EmptyState from '../ui/EmptyState'

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
  const comments = useTaskComments(taskId)
  const me = useCurrentUser()
  const can = useCan()
  const canReassign = useCanReassign()
  const canModifyThis = useCanModifyTask()(task)
  const toast = useToast()
  const [comment, setComment] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reasonOpen, setReasonOpen] = useState(null)
  const [reason, setReason] = useState('')

  const canEdit = can('edit_tasks') && canModifyThis
  const canDelete = can('delete_tasks') && canModifyThis
  const canCreate = can('create_tasks')
  const canComment = canEdit
  const isCancelled = task?.status === 'cancelled'
  const cancelAuthor = isCancelled
    ? state.users.find((u) => u.id === task.canceledBy)
    : null

  useEffect(() => {
    setComment('')
    setReason('')
    setReasonOpen(null)
  }, [taskId, open])

  if (!open || !task) return null

  const actorId = state.currentUserId

  const change = (patch, msg) => {
    dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch, actorId })
    if (msg) toast.success(msg)
  }

  const taskActivities = state.activities.filter((a) => a.taskId === task.id).slice(0, 8)

  const submitComment = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    dispatch({ type: 'ADD_COMMENT', taskId: task.id, userId: state.currentUserId, text: comment.trim() })
    setComment('')
    toast.success('Comentário adicionado')
  }

  const doneSubtasks = task.subtasks.filter((s) => s.done).length

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Detalhes da tarefa"
        subtitle={`Criada em ${formatDate(task.createdAt)}`}
        disableDismiss={confirmDelete || reasonOpen !== null}
        footer={
          <>
            {canDelete && (
              <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                Excluir
              </Button>
            )}
            {canCreate && (
              <Button
                variant="ghost"
                icon={Copy}
                onClick={() => {
                  dispatch({ type: 'DUPLICATE_TASK', taskId: task.id, actorId })
                  toast.success('Tarefa duplicada')
                }}
              >
                Duplicar
              </Button>
            )}
            {canEdit && task.status !== 'done' && task.status !== 'cancelled' && (
              <Button
                variant="ghost"
                icon={Ban}
                onClick={() => {
                  setReason('')
                  setReasonOpen('cancel')
                }}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Cancelar
              </Button>
            )}
            <span className="flex-1" />
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            {canEdit && (
              <Button
                icon={Pencil}
                onClick={() => {
                  onEdit?.(task)
                  onClose()
                }}
              >
                Editar
              </Button>
            )}
          </>
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
                    disabled={!canEdit}
                    onClick={() =>
                      dispatch({ type: 'TOGGLE_SUBTASK', taskId: task.id, subtaskId: s.id })
                    }
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800/70 ${
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
              <MetaRow
                icon={User}
                label="Responsável"
                value={task.assigneeId ? state.users.find((u) => u.id === task.assigneeId)?.name : 'Não atribuída'}
              >
                {task.assigneeId ? (
                  <Avatar user={state.users.find((u) => u.id === task.assigneeId)} size="sm" />
                ) : null}
              </MetaRow>
              <MetaRow
                icon={FolderKanban}
                label="Projeto"
                value={task.projectId ? state.projects.find((p) => p.id === task.projectId)?.name : 'Sem projeto'}
              />
              <MetaRow
                icon={Tag}
                label="Categoria"
                value={state.categories.find((c) => c.id === task.categoryId)?.name || '—'}
              />
              <MetaRow
                icon={Calendar}
                label="Vencimento"
                value={task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'}
              />
              <MetaRow
                icon={Clock}
                label="Horas estimadas"
                value={task.estimatedHours ? `${task.estimatedHours}h` : 'Não estimado'}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Dropdown
                align="right"
                trigger={
                  <button
                    disabled={!canEdit}
                    title={canEdit ? 'Alterar status' : 'Você não pode editar esta tarefa'}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
                  }))}
              />
              <Dropdown
                align="right"
                trigger={
                  <button
                    disabled={!canReassign}
                    title={canReassign ? 'Alterar responsável' : 'Somente gestores podem reatribuir tarefas'}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Alterar responsável
                    <ChevronDown size={15} className="text-slate-400" />
                  </button>
                }
                items={[
                  {
                    label: 'Não atribuída',
                    active: !task.assigneeId,
                    onClick: () => {
                      if (task.assigneeId) change({ assigneeId: null }, 'Atribuição removida')
                    }
                  },
                  { type: 'divider' },
                  ...state.users
                    .filter((u) => u.active !== false)
                    .map((u) => ({
                      label: u.name,
                      active: task.assigneeId === u.id,
                      onClick: () => {
                        if (task.assigneeId !== u.id)
                          change({ assigneeId: u.id }, `Atribuída a ${u.name}`)
                      }
                    }))
                ]}
              />
            </div>

            {task.status === 'review' && canEdit && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Tarefa em revisão
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Aprove para concluir ou devolva ao responsável com um motivo.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    icon={ShieldCheck}
                    onClick={() => {
                      dispatch({ type: 'APPROVE_TASK', taskId: task.id, actorId })
                      toast.success('Tarefa aprovada e concluída')
                    }}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={() => {
                      setReason('')
                      setReasonOpen('return')
                    }}
                  >
                    Devolver com motivo
                  </Button>
                </div>
              </div>
            )}

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
                {cancelAuthor && (
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Decidido por {cancelAuthor.name}
                  </p>
                )}
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
                {taskActivities.map((a) => {
                  const actor = state.users.find((u) => u.id === a.actorId)
                  return (
                    <li key={a.id} className="flex items-start gap-2.5">
                      <Avatar user={actor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">{a.text}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                          {formatRelative(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <MessageSquare size={13} /> Comentários ({comments.length})
            </p>
            <div className="space-y-3">
              {comments.length === 0 && (
                <EmptyState
                  icon={MessageSquare}
                  title="Sem comentários"
                  description="Seja o primeiro a comentar nesta tarefa."
                  compact
                />
              )}
              {comments.map((c) => {
                const author = state.users.find((u) => u.id === c.userId)
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <Avatar user={author} size="sm" />
                    <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {author?.name}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatRelative(c.createdAt)}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{c.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {canComment ? (
              <form onSubmit={submitComment} className="mt-4">
                <div className="flex items-start gap-2.5">
                  <Avatar user={me} size="sm" />
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button type="submit" size="sm" icon={Send} disabled={!comment.trim()}>
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400 dark:border-slate-700">
                Seu perfil não tem permissão para comentar nesta tarefa.
              </p>
            )}
          </div>
        </div>
      </Drawer>

      <Modal
        open={reasonOpen !== null}
        onClose={() => setReasonOpen(null)}
        title={reasonOpen === 'cancel' ? 'Cancelar tarefa' : 'Devolver tarefa'}
        description={
          reasonOpen === 'cancel'
            ? 'Informe o motivo do cancelamento e quem decidiu ficará registrado.'
            : 'Informe o motivo da devolução para o responsável corrigir.'
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReasonOpen(null)}>
              Voltar
            </Button>
            <Button
              disabled={!reason.trim()}
              onClick={() => {
                const reasonText = reason.trim()
                if (reasonOpen === 'cancel') {
                  dispatch({ type: 'CANCEL_TASK', taskId: task.id, reason: reasonText, actorId })
                  toast.success('Tarefa cancelada')
                } else {
                  dispatch({ type: 'RETURN_TASK', taskId: task.id, reason: reasonText, actorId })
                  toast.success('Tarefa devolvida para execução')
                }
                setReason('')
                setReasonOpen(null)
              }}
            >
              {reasonOpen === 'cancel' ? 'Cancelar tarefa' : 'Devolver'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Motivo"
          autoFocus
          placeholder={
            reasonOpen === 'cancel'
              ? 'Ex.: Fora de escopo, duplicada, prioridade mudou...'
              : 'Ex.: Critérios de aceite não atendidos, falta de testes...'
          }
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          try {
            deleteTaskWithUndo({ dispatch, toast, task, actorId })
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
