import { Eye, Pencil, Trash2, Flag, CheckCircle2, RotateCcw, Star, Copy, Ban, Repeat } from 'lucide-react'
import { STATUS, PRIORITY, RECURRENCE } from '../../lib/constants'

const MOVE_STATUSES = Object.values(STATUS).filter((s: any) => s.key !== 'cancelled')

export function buildTaskMenu(
  task: any,
  { onOpen, onEdit, onDelete, onChange, onFavorite, onDuplicate, onToggleDone, onCancel, allowEdit = true, allowDelete = true, allowCreate = true }: any
) {
  const items: any[] = [
    { label: 'Abrir detalhes', icon: Eye, onClick: onOpen }
  ]
  if (allowEdit) {
    items.push({ label: 'Editar tarefa', icon: Pencil, onClick: onEdit })
  }
  items.push({
    label: task.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
    icon: Star,
    onClick: onFavorite
  })
  if (allowCreate) {
    items.push({ label: 'Duplicar tarefa', icon: Copy, onClick: onDuplicate })
  }
  if (allowEdit) {
    if (onToggleDone && task.status !== 'cancelled') {
      items.push({
        label: task.status === 'done' ? 'Reabrir tarefa' : 'Marcar como concluída',
        icon: task.status === 'done' ? RotateCcw : CheckCircle2,
        onClick: () => onToggleDone(task)
      })
    } else if (task.status !== 'done') {
      items.push({
        label: 'Marcar como concluída',
        icon: CheckCircle2,
        onClick: () => onChange({ status: 'done' })
      })
    }
    if (task.recurrence && task.recurrence !== 'none') {
      items.push({
        label: `Repete ${(RECURRENCE as Record<string, any>)[task.recurrence]?.label?.toLowerCase() || ''}`,
        icon: Repeat,
        disabled: true
      })
    }
    items.push({ type: 'divider' })
    items.push({ type: 'label', label: 'Mover para' })
    MOVE_STATUSES.forEach((s: any) => {
      items.push({
        label: s.label,
        active: task.status === s.key,
        onClick: () => {
          if (task.status !== s.key) onChange({ status: s.key })
        }
      })
    })
    items.push({ type: 'divider' })
    items.push({ type: 'label', label: 'Prioridade' })
    Object.values(PRIORITY).forEach((p: any) => {
      items.push({
        label: p.label,
        icon: Flag,
        active: task.priority === p.key,
        onClick: () => {
          if (task.priority !== p.key) onChange({ priority: p.key })
        }
      })
    })
  }
  if (allowEdit && onCancel && task.status !== 'done' && task.status !== 'cancelled') {
    items.push({ type: 'divider' })
    items.push({
      label: 'Cancelar tarefa',
      icon: Ban,
      danger: true,
      onClick: onCancel
    })
  }
  if (allowDelete) {
    items.push({ type: 'divider' })
    items.push({
      label: 'Excluir tarefa',
      icon: Trash2,
      danger: true,
      onClick: onDelete
    })
  }
  return items
}
