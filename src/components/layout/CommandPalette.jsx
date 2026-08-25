import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, ListTodo, FolderKanban, Tags, Settings, Activity, LayoutDashboard, FileText } from 'lucide-react'
import { useStore } from '../../store/store'
import { StatusBadge } from '../ui/Badge'

const PAGE_ACTIONS = [
  { to: '/', label: 'Ir para o Dashboard', icon: LayoutDashboard },
  { to: '/tarefas', label: 'Ir para Tarefas', icon: ListTodo },
  { to: '/projetos', label: 'Ir para Projetos', icon: FolderKanban },
  { to: '/categorias', label: 'Ir para Categorias', icon: Tags },
  { to: '/atividades', label: 'Ir para Atividades', icon: Activity },
  { to: '/configuracoes', label: 'Ir para Configurações', icon: Settings }
]

export default function CommandPalette({ open, onClose }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { tasks: [], projects: [], pages: PAGE_ACTIONS }
    const tasks = state.tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
      )
      .slice(0, 6)
    const projects = state.projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 4)
    return {
      tasks,
      projects,
      pages: PAGE_ACTIONS.filter((p) => p.label.toLowerCase().includes(q))
    }
  }, [query, state])

  const flat = useMemo(() => {
    const items = []
    if (results.tasks.length) {
      items.push({ type: 'header', label: 'Tarefas' })
      results.tasks.forEach((t) => items.push({ type: 'task', data: t }))
    }
    if (results.projects.length) {
      items.push({ type: 'header', label: 'Projetos' })
      results.projects.forEach((p) => items.push({ type: 'project', data: p }))
    }
    if (results.pages.length) {
      items.push({ type: 'header', label: 'Navegação' })
      results.pages.forEach((p) => items.push({ type: 'page', data: p }))
    }
    return items
  }, [results])

  useEffect(() => {
    setActive(0)
  }, [query])

  if (!open) return null

  const run = (item) => {
    onClose()
    if (item.type === 'task') navigate(`/tarefas?task=${item.data.id}`)
    else if (item.type === 'page') navigate(item.data.to)
    else if (item.type === 'project') navigate(`/projetos?proj=${item.data.id}`)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      const item = flat[active]
      if (item && item.type !== 'header') run(item)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[75] flex items-start justify-center bg-slate-900/50 p-4 pt-[12vh] backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-popover animate-scale-in dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar tarefas, projetos... (Esc para fechar)"
            className="h-14 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200"
          />
          <kbd className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:block dark:border-slate-700">
            ESC
          </kbd>
        </div>
        <div className="max-h-[380px] overflow-y-auto py-2">
          {flat.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhum resultado para “{query}”
            </p>
          )}
          {flat.map((item, i) => {
            if (item.type === 'header') {
              return (
                <p
                  key={item.label}
                  className="px-4 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500"
                >
                  {item.label}
                </p>
              )
            }
            const isActive = i === active
            const d = item.data
            const Icon = item.type === 'task' ? FileText : item.type === 'project' ? FolderKanban : d.icon
            return (
              <button
                key={d.id || d.label}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(item)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition ${
                  isActive ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                }`}
              >
                <Icon size={16} className="shrink-0 text-slate-400" />
                <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
                  {item.type === 'task' ? d.title : d.name || d.label}
                </span>
                {item.type === 'task' && <StatusBadge status={d.status} size="sm" />}
                {isActive && (
                  <CornerDownLeft size={14} className="shrink-0 text-slate-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
