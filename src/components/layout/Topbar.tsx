import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  Eye,
  EyeOff,
  Keyboard,
  LayoutGrid,
  LayoutList,
  Menu,
  MoreVertical,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Sun,
  X,
  type LucideIcon,
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

interface SecondaryAction {
  key: string;
  /** Rótulo exibido no menu "Mais opções". */
  name: string;
  /** aria-label/title do botão inline (aparece a partir de md). */
  ariaLabel: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  activeCls?: string;
  fillWhenActive?: boolean;
}

/** Menu "⋯" com as ações secundárias, visível apenas em telas menores que md. */
function OverflowMenu({ actions }: { actions: SecondaryAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative md:hidden" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Mais opções"
        title="Mais opções"
        className={iconButton}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-[60] mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {actions.map((a) => {
            const Icon = a.icon;
            const activeText = a.active
              ? a.key === 'favoritas'
                ? 'text-amber-500'
                : 'text-indigo-600 dark:text-indigo-300'
              : 'text-slate-700 dark:text-slate-200';
            return (
              <button
                key={a.key}
                onClick={() => {
                  a.onClick();
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${activeText}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${a.active && a.fillWhenActive ? 'fill-amber-400' : ''}`}
                />
                <span>{a.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const secondaryActions: SecondaryAction[] = [
    {
      key: 'tema',
      name: 'Tema',
      ariaLabel: state.tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro',
      icon: state.tema === 'escuro' ? Sun : Moon,
      onClick: () => dispatch({ type: 'TOGGLE_TEMA' }),
    },
    {
      key: 'kpi',
      name: 'Indicadores',
      ariaLabel: state.kpiCollapsed ? 'Expandir indicadores' : 'Recolher indicadores',
      icon: state.kpiCollapsed ? Eye : EyeOff,
      onClick: () => dispatch({ type: 'TOGGLE_KPI_COLLAPSED' }),
    },
    {
      key: 'filtros',
      name: 'Filtros',
      ariaLabel: state.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros',
      icon: SlidersHorizontal,
      onClick: () => dispatch({ type: 'TOGGLE_FILTERS' }),
      active: state.filtersOpen,
      activeCls:
        'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/40',
    },
    {
      key: 'favoritas',
      name: 'Favoritas',
      ariaLabel: state.filters.favoritas ? 'Remover favoritas' : 'Apenas favoritas',
      icon: Star,
      onClick: () =>
        dispatch({ type: 'SET_FILTERS', filters: { favoritas: !state.filters.favoritas } }),
      active: state.filters.favoritas,
      activeCls: 'text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30',
      fillWhenActive: true,
    },
    {
      key: 'atalhos',
      name: 'Atalhos',
      ariaLabel: 'Atalhos de teclado',
      icon: Keyboard,
      onClick: () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'shortcuts' } }),
    },
  ];

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700 dark:bg-slate-800">
      {/* Zona esquerda: menu + título (empurra o restante para a direita) */}
      <div className="mr-auto flex min-w-0 items-center gap-2">
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

      {/* Busca: sempre na linha do topo, compacta e expansível ao focar */}
      <div className="relative min-w-0 w-16 transition-[width] duration-300 focus-within:w-40 md:w-28 md:focus-within:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            if (search) {
              onSearch('');
            } else {
              e.currentTarget.blur();
            }
          }}
          aria-label="Buscar tarefas"
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

      {/* Zona de ações: essenciais sempre visíveis; secundárias no menu "⋯" em telas menores */}
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
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm sm:inline-flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
            title="Notificações de lembrete ativas"
          >
            <BellRing className="h-4 w-4 text-emerald-500" />
          </span>
        )}

        {secondaryActions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={a.onClick}
              aria-label={a.ariaLabel}
              title={a.ariaLabel}
              className={`hidden md:inline-flex ${iconButton} ${a.active && a.activeCls ? a.activeCls : ''}`}
            >
              <Icon className={`h-4 w-4 ${a.active && a.fillWhenActive ? 'fill-amber-400' : ''}`} />
            </button>
          );
        })}

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

        <OverflowMenu actions={secondaryActions} />

        <button
          onClick={onNewTask}
          aria-label="Nova Tarefa"
          title="Nova Tarefa (N)"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
