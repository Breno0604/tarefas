import React, { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Plus,
  Sun,
  Moon,
  Settings as SettingsIcon
} from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationsPanel from './NotificationsPanel'
import CommandPalette from './CommandPalette'
import TaskFormModal from '../tasks/TaskFormModal'
import Button from '../ui/Button'
import { useToast } from '../../store/toast'
import Tooltip from '../ui/Tooltip'
import Modal from '../ui/Modal'
import { useStore } from '../../store/store'
import { isTypingTarget } from '../../lib/utils'
import { KEYBOARD_SHORTCUTS } from '../../lib/constants'
import { PageSkeleton } from '../ui/Skeleton'

const TITLES = {
  '/': { title: 'Hoje', subtitle: 'Sua agenda do dia' },
  '/dashboard': { title: 'Dashboard', subtitle: 'Visão geral das suas tarefas' },
  '/tarefas': { title: 'Tarefas', subtitle: 'Organize tudo o que você precisa fazer' },
  '/projetos': { title: 'Projetos', subtitle: 'Acompanhe o progresso dos seus projetos' },
  '/atividades': { title: 'Atividades', subtitle: 'Seu histórico recente' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Preferências pessoais' },
  '/lixeira': { title: 'Lixeira', subtitle: 'Tarefas excluídas' }
}

export default function AppLayout() {
  const { state, dispatch } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const themeRef = useRef(state.theme)
  themeRef.current = state.theme

  useEffect(() => {
    const onKey = (e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o: any) => !o)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e)) return
      const key = e.key.toLowerCase()
      if (key === 'n') {
        e.preventDefault()
        setQuickOpen(true)
      } else if (key === 'd') {
        e.preventDefault()
        dispatch({ type: 'SET_THEME', theme: themeRef.current === 'dark' ? 'light' : 'dark' })
      } else if (key === '/') {
        if (location.pathname !== '/tarefas') {
          e.preventDefault()
          setPaletteOpen(true)
        }
      } else if (key === '?') {
        e.preventDefault()
        setShortcutsOpen(true)
      } else if (key === 'f' && location.pathname === '/tarefas') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('taskflow:toggle-favorites'))
      } else if (key === 't' && !e.shiftKey) {
        e.preventDefault()
        navigate('/lixeira')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [location.pathname, dispatch])

  useEffect(() => {
    setNotifOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  // Warn user when localStorage persistence fails
  const layoutToast = useToast()
  useEffect(() => {
    const handler = () => layoutToast.error('Dados não salvos — o armazenamento local está cheio ou indisponível.')
    window.addEventListener('taskflow:storage-error', handler)
    return () => window.removeEventListener('taskflow:storage-error', handler)
  }, [layoutToast])

  const pageMeta = (TITLES as any)[location.pathname] || { title: 'TaskFlow', subtitle: '' }

  if (!state.booted) {
    return (
      <div className="min-h-screen">
        <div className="hidden h-screen w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block" />
        <div className="lg:pl-64">
          <div className="px-6 py-6 lg:px-10">
            <PageSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:gap-3 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="tap-feedback rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 sm:p-3 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              {pageMeta.title}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
              {pageMeta.subtitle}
            </p>
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition hover:border-slate-300 hover:text-slate-600 md:flex dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
          >
            <Search size={15} />
            </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="tap-feedback rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 sm:p-3 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>

          <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />

          <Tooltip side="bottom" content={state.theme === 'dark' ? 'Modo claro (D)' : 'Modo escuro (D)'}>
            <button
              onClick={() =>
                dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })
              }
              className="tap-feedback inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 sm:h-11 sm:w-11 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              aria-label="Alternar tema"
            >
              {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </Tooltip>

          <Tooltip content="Configurações">
            <button
              onClick={() => navigate('/configuracoes')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              aria-label="Configurações"
            >
              <SettingsIcon size={16} />
            </button>
          </Tooltip>

          <Tooltip side="bottom" content="Nova tarefa (N)">
            <Button iconOnly icon={Plus} onClick={() => setQuickOpen(true)} aria-label="Nova tarefa" />
          </Tooltip>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <TaskFormModal open={quickOpen} onClose={() => setQuickOpen(false)} />

      <Modal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="Atalhos de teclado"
        description="Navegue e gerencie tarefas mais rápido."
        size="sm"
      >
        <ul className="space-y-2.5">
          {KEYBOARD_SHORTCUTS.map(([keys, label]) => (
            <li key={keys} className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}
