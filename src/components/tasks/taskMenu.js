import { Eye, Pencil, Trash2, Flag, CheckCircle2, Star, Copy, ShieldCheck, Ban } from 'lucide-react'
import { STATUS, PRIORITY } from '../../lib/constants'

const MOVE_STATUSES = Object.values(STATUS).filter((s) => s.key !== 'cancelled')

export function buildTaskMenu(
  task,
  { onOpen, onEdit, onDelete, onChange, onFavorite, onDuplicate, onApprove, onCancel, allowEdit = true, allowDelete = true, allowCreate = true }
) {
  const items = [
    { label: 'Abrir detalhes', icon: Eye, onClick: onOpen }
  ]
  if (allowEdit) {
    items.push({ label: 'Editar tarefa', icon: Pencil, onClick: onEdit })
  }
  if (allowEdit && task.status === 'review' && onApprove) {
    items.push({
      label: 'Aprovar tarefa',
      icon: ShieldCheck,
      onClick: onApprove
    })
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
    if (task.status !== 'done') {
      items.push({
        label: 'Marcar como concluída',
        icon: CheckCircle2,
        onClick: () => onChange({ status: 'done' })
      })
    }
    items.push({ type: 'divider' })
    items.push({ type: 'label', label: 'Mover para' })
    MOVE_STATUSES.forEach((s) => {
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
    Object.values(PRIORITY).forEach((p) => {
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
