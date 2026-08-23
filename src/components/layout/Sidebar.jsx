import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ListTodo,
  Users,
  FolderKanban,
  Tags,
  Activity,
  Settings,
  ShieldCheck,
  X,
  Lock
} from 'lucide-react'
import { useStore, useActiveProfile } from '../../store/store'
import { useToast } from '../../store/toast'
import { Avatar } from '../ui/Badge'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
  { to: '/equipe', label: 'Equipe', icon: Users, perm: 'manage_team' },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban, perm: 'manage_projects' },
  { to: '/categorias', label: 'Categorias', icon: Tags, perm: 'manage_projects' },
  { to: '/atividades', label: 'Atividades', icon: Activity },
  { to: '/perfis', label: 'Perfis de acesso', icon: ShieldCheck, perm: 'manage_profiles' },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, perm: 'view_settings' }
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { state } = useStore()
  const activeProfile = useActiveProfile()
  const toast = useToast()
  const navigate = useNavigate()
  const me = state.users.find((u) => u.id === state.currentUserId)
  const openTasks = state.tasks.filter((t) => t.status !== 'done').length

  const can = (perm) => (activeProfile?.permissions || []).includes(perm)

  const handleNavClick = (item) => {
    if (item.perm && !can(item.perm)) {
      toast.info(`Seu perfil (${activeProfile?.name}) não tem permissão para acessar "${item.label}"`)
      return
    }
    onClose()
    navigate(item.to)
  }

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
              CRM de tarefas
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
          {NAV.map((item) => {
            const Icon = item.icon
            const restricted = Boolean(item.perm && !can(item.perm))
            const inner = ({ isActive }) => (
              <>
                {isActive && !restricted && (
                  <span className="absolute -left-3 h-5 w-1 rounded-r bg-brand-600 dark:bg-brand-400" />
                )}
                <Icon
                  size={18}
                  className={
                    restricted
                      ? 'text-slate-400'
                      : isActive
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
                {restricted && <Lock size={13} className="text-slate-400" />}
              </>
            )
            const cls = restricted
              ? 'group relative flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 opacity-60 dark:text-slate-500'
              : 'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
            if (restricted) {
              return (
                <button key={item.to} type="button" onClick={() => handleNavClick(item)} className={cls}>
                  {inner({ isActive: false })}
                </button>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => handleNavClick(item)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                  }`
                }
              >
                {inner}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <p className="text-xs font-bold">Sua equipe</p>
          <p className="mt-0.5 text-[11px] opacity-80">Produtividade +12% este mês</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-[72%] rounded-full bg-white" />
          </div>
        </div>
        <button
          onClick={() => {
            onClose()
            navigate('/configuracoes')
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Avatar user={me} size="md" showStatus />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
              {me?.name}
            </span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
              {me?.role}
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
