import { Eye, Pencil, Trash2, CheckCircle2, RotateCcw, Star, Copy, Ban, CalendarClock, Archive, ArchiveRestore } from 'lucide-react'
import { STATUS } from '../../lib/constants'

/** Compute a YYYY-MM-DD date key offset from today. */
function offsetDateKey(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function buildTaskMenu(
  task: any,
  { onOpen, onEdit, onDelete, onChange, onFavorite, onDuplicate, onToggleDone, onCancel, onReschedule, allowEdit = true, allowDelete = true, allowCreate = true }: any
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
  }

  // Quick reschedule — only for active tasks with a due date
  if (allowEdit && onReschedule && task.status !== 'done' && task.status !== 'cancelled') {
    items.push({ type: 'divider' })
    items.push({ type: 'label', label: 'Adiar' })
    items.push({
      label: 'Amanhã',
      icon: CalendarClock,
      onClick: () => onReschedule(offsetDateKey(1))
    })
    items.push({
      label: '3 dias',
      icon: CalendarClock,
      onClick: () => onReschedule(offsetDateKey(3))
    })
    items.push({
      label: '1 semana',
      icon: CalendarClock,
      onClick: () => onReschedule(offsetDateKey(7))
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
  if (allowEdit && onToggleDone && task.status !== 'cancelled') {
    items.push({
      label: task.archived ? 'Desarquivar tarefa' : 'Arquivar tarefa',
      icon: task.archived ? ArchiveRestore : Archive,
      onClick: () => {
        if (onReschedule) onReschedule('__archive__')
      }
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
