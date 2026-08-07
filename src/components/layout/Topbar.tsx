import { useState } from 'react';
import {
  Bell,
  BellRing,
  Eye,
  EyeOff,
  LayoutGrid,
  LayoutList,
  Menu,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Sun,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopbarProps {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  onNewTask: () => void;
}

const iconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200';

export default function Topbar({ title, search, onSearch, onNewTask }: TopbarProps) {
  const { state, dispatch } = useApp();
  const [notifPerm, setNotifPerm] = useState(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  const alternarView = () =>
    dispatch({ type: 'SET_VIEW', view: state.view === 'lista' ? 'quadro' : 'lista' });

  const ativarNotificacoes = async () => {
    if (typeof Notification === 'undefined') return;
    const permissao = await Notification.requestPermission();
    setNotifPerm(permissao);
  };

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className={iconButton}
          title="Abrir menu"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="truncate text-lg font-semibold text-slate-800 sm:text-xl dark:text-slate-100">{title}</h1>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <div className="relative min-w-0 flex-1 max-w-20 transition-[max-width] duration-300 focus-within:max-w-40 sm:max-w-36 sm:focus-within:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Buscar tarefas"
            placeholder="Buscar ( / )"
            className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50 pr-9 pl-9 text-sm text-slate-700 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:bg-slate-700 dark:focus:ring-indigo-900/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Limpar busca"
              title="Limpar busca"
              className="absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {notifPerm === 'default' && (
            <button
              onClick={ativarNotificacoes}
              aria-label="Ativar notificações de lembrete"
              title="Ativar notificações de lembrete"
              className={`${iconButton} relative`}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500" />
            </button>
          )}
          {notifPerm === 'granted' && (
            <span
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-500 sm:inline-flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
              title="Notificações de lembrete ativas"
            >
              <BellRing className="h-4 w-4 text-emerald-500" />
              Notificações ativas
            </span>
          )}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TEMA' })}
            aria-label={state.tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={state.tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            className={iconButton}
          >
            {state.tema === 'escuro' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_KPI_COLLAPSED' })}
            aria-expanded={!state.kpiCollapsed}
            aria-label={state.kpiCollapsed ? 'Expandir indicadores' : 'Recolher indicadores'}
            title={state.kpiCollapsed ? 'Expandir indicadores' : 'Recolher indicadores'}
            className={iconButton}
          >
            {state.kpiCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FILTERS' })}
            aria-expanded={state.filtersOpen}
            aria-label={state.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            title={state.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            className={`${iconButton} ${
              state.filtersOpen ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/40' : ''
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'SET_FILTERS', filters: { favoritas: !state.filters.favoritas } })
            }
            aria-label={state.filters.favoritas ? 'Remover favoritas' : 'Apenas favoritas'}
            title={state.filters.favoritas ? 'Remover favoritas' : 'Apenas favoritas'}
            className={`${iconButton} ${
              state.filters.favoritas ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30' : ''
            }`}
          >
            <Star className={`h-4 w-4 ${state.filters.favoritas ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={alternarView}
            aria-label={state.view === 'lista' ? 'Ver como Quadro' : 'Ver como Lista'}
            title={state.view === 'lista' ? 'Ver como Quadro' : 'Ver como Lista'}
            className={iconButton}
          >
            {state.view === 'lista' ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <LayoutList className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onNewTask}
            aria-label="Nova Tarefa"
            title="Nova Tarefa (N)"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
