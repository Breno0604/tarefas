import React from 'react'
import { Circle } from 'lucide-react'
import { STATUS, PRIORITY } from '../../lib/constants'
import { formatDay } from '../../lib/format'

export function StatusBadge({ status, dot = true, size = 'md' }: { status: string; dot?: boolean; size?: 'sm' | 'md' }): React.ReactElement {
  const cfg = (STATUS as Record<string, typeof STATUS.todo>)[status] || STATUS.todo
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${cfg.badge} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }): React.ReactElement {
  const cfg = (PRIORITY as Record<string, typeof PRIORITY.medium>)[priority] || PRIORITY.medium
  const styles = {
    urgent: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15',
    high: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/15',
    medium: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15',
    low: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
  }
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${(styles as Record<string, string>)[priority]}`}
    >
      <Circle size={7} fill="currentColor" className="opacity-70" />
      {cfg.label}
    </span>
  )
}

export function ProjectTag({ project, className = "" }: { project: { name: string; color: string } | null; className?: string }): React.JSX.Element {
  if (!project) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 ${className}`}>
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        Sem projeto
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 ${className}`}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
      {project.name}
    </span>
  )
}

export function Tag({ children, color = '#94a3b8' }: { children: React.ReactNode; color?: string }): React.JSX.Element {
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {children}
    </span>
  )
}

export function DueDateBadge({ dueDate, status, className = "" }: { dueDate: string | null; status: string; className?: string }): React.JSX.Element | null {
  if (!dueDate) return null
  const overdue = new Date(dueDate).getTime() < Date.now() && status !== 'done'
  const isDone = status === 'done'
  const textColor = isDone
    ? 'text-slate-400 dark:text-slate-500'
    : overdue
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-500 dark:text-slate-400'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${textColor} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isDone ? 'bg-slate-300 dark:bg-slate-500' : overdue ? 'bg-red-500' : 'bg-slate-400'}`} />
      {formatDay(dueDate)}
    </span>
  )
}
