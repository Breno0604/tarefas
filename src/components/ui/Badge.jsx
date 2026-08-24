import React from 'react'
import { Circle } from 'lucide-react'
import { STATUS, PRIORITY } from '../../lib/constants'
import { initials, formatDay } from '../../lib/format'

export function StatusBadge({ status, dot = true, size = 'md' }) {
  const cfg = STATUS[status] || STATUS.todo
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

export function PriorityBadge({ priority }) {
  const cfg = PRIORITY[priority] || PRIORITY.medium
  const styles = {
    urgent: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15',
    high: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/15',
    medium: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15',
    low: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
  }
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${styles[priority]}`}
    >
      <Circle size={7} fill="currentColor" className="opacity-70" />
      {cfg.label}
    </span>
  )
}

export function Avatar({ user, size = 'md', showStatus = false, ring = false }) {
  if (!user) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-slate-200 font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${
          size === 'xs' ? 'h-5 w-5 text-[8px]' : size === 'sm' ? 'h-6 w-6 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-8 w-8 text-xs'
        }`}
      >
        ?
      </span>
    )
  }
  const sizes = {
    xs: 'h-5 w-5 text-[8px]',
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-12 w-12 text-base'
  }
  return (
    <span className="relative inline-flex">
      <span
        title={user.name}
        className={`inline-flex items-center justify-center rounded-full font-bold text-white ${sizes[size]} ${ring ? 'ring-2 ring-white dark:ring-slate-900' : ''}`}
        style={{ backgroundColor: user.color }}
      >
        {initials(user.name)}
      </span>
      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
            user.online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        />
      )}
    </span>
  )
}

export function AvatarStack({ users, max = 4, size = 'md' }) {
  const shown = users.slice(0, max)
  const rest = users.length - shown.length
  return (
    <span className="inline-flex items-center -space-x-2">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} ring />
      ))}
      {rest > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900 ${
            size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'
          }`}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}

export function ProjectTag({ project, className = '' }) {
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

export function Tag({ children, color = '#94a3b8' }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {children}
    </span>
  )
}

export function DueDateBadge({ dueDate, status, className = '' }) {
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
