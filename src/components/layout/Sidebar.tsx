import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Sunrise,
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  Tags,
  Activity,
  Settings,
  Trash2,
  X
} from 'lucide-react'
import { useStore, useMe } from '../../store/store'

const NAV = [
  { to: '/', label: 'Hoje', icon: Sunrise, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/atividades', label: 'Atividades', icon: Activity },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/lixeira', label: 'Lixeira', icon: Trash2 }
]

export default function Sidebar({ mobileOpen, onClose }: any) {
  const { state } = useStore()
  const me = useMe()
  const navigate = useNavigate()
  const openTasks = state.tasks.filter((t: any) => t.status === 'todo' || t.status === 'in_progress').length

  const initial = (me?.name || 'V').trim().charAt(0).toUpperCase()

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              TaskFlow
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Tarefas pessoais
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-3">
        <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Menu
        </p>
        <nav className="space-y-0.5">
          {NAV.map((item: any) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => onClose()}
                className={({ isActive }: any) =>
                  `tap-feedback group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition outline-none ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-300 dark:bg-brand-500/15 dark:text-brand-300 dark:focus-visible:ring-brand-500/50'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 dark:focus-visible:ring-slate-600'
                  }`
                }
              >
                {({ isActive }: any) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 -translate-x-1.5 rounded-r bg-brand-600 dark:bg-brand-400" />
                    )}
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.label === 'Tarefas' && openTasks > 0 && (
                      <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                        {openTasks}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <button
          onClick={() => {
            onClose()
            navigate('/configuracoes')
          }}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
              {me?.name || 'Você'}
            </span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
              Uso pessoal
            </span>
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 animate-fade-in"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-white shadow-xl animate-slide-left-in dark:border-slate-800 dark:bg-slate-900">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
