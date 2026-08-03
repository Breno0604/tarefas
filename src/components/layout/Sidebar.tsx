import { useEffect, useState } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListChecks,
  Users,
  AlertTriangle,
  CheckCircle2,
  Undo2,
} from 'lucide-react';
import { ALL_USERS, COLABORADORES, findUser, GESTOR } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { colaboradorMetrics, colaboradorResumo } from '../../utils/tasks';
import type { Section } from '../../types';

const NAV: { section: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { section: 'visaoGeral', label: 'Visão Geral', icon: LayoutDashboard },
  { section: 'tarefas', label: 'Tarefas', icon: ListChecks },
  { section: 'colaboradores', label: 'Colaboradores', icon: Users },
];

function useNarrowSidebar(): boolean {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

export default function Sidebar() {
  const { state, dispatch } = useApp();
  // Abaixo de 1024px a sidebar fica sempre recolhida (ícones); o botão continua para telas largas.
  const collapsed = state.sidebarCollapsed || useNarrowSidebar();

  const goTo = (section: Section) => dispatch({ type: 'SET_SECTION', section });

  const atalhos = [
    {
      label: 'Atrasadas',
      icon: AlertTriangle,
      onClick: () => {
        dispatch({ type: 'SET_SECTION', section: 'tarefas' });
        dispatch({ type: 'SET_FILTERS', filters: { prazo: 'vencidas' } });
      },
    },
    {
      label: 'Finalizadas',
      icon: CheckCircle2,
      onClick: () => {
        dispatch({ type: 'SET_SECTION', section: 'tarefas' });
        dispatch({ type: 'SET_FILTERS', filters: { status: ['FINALIZADA'] } });
      },
    },
    {
      label: 'Devolvidas',
      icon: Undo2,
      onClick: () => {
        dispatch({ type: 'SET_SECTION', section: 'tarefas' });
        dispatch({ type: 'SET_FILTERS', filters: { status: ['DEVOLVIDA'] } });
      },
    },
  ];

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
          TF
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">TaskFlow</p>
            <p className="truncate text-xs text-slate-400">Gestão de Tarefas</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 px-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = state.section === item.section;
          return (
            <button
              key={item.section}
              onClick={() => goTo(item.section)}
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {!collapsed && (
          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Atalhos
          </div>
        )}
        {atalhos.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={a.onClick}
              title={collapsed ? a.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{a.label}</span>}
            </button>
          );
        })}

        {/* Colaboradores */}
        {!collapsed && (
          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Colaboradores
          </div>
        )}
        {COLABORADORES.map((c) => {
          const metrics = colaboradorMetrics(c.id, state.tasks);
          const iniciais = colaboradorResumo(c).iniciais;
          return (
            <button
              key={c.id}
              onClick={() => {
                goTo('colaboradores');
                dispatch({ type: 'OPEN_MODAL', modal: { type: 'colaborador', colaboradorId: c.id } });
              }}
              title={collapsed ? c.nome : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-800 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: c.cor }}
              >
                {iniciais}
              </span>
              {!collapsed && (
                <span className="flex min-w-0 flex-1 items-center justify-between">
                  <span className="truncate text-slate-300">{c.nome.split(' ')[0]}</span>
                  {metrics.ativas > 0 && (
                    <span className="ml-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {metrics.ativas}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Usuário atual */}
      <div className="border-t border-slate-800 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: findUser(state.currentUserId)?.cor ?? '#64748b' }}
            >
              {colaboradorResumo(findUser(state.currentUserId) ?? GESTOR).iniciais}
            </span>
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {findUser(state.currentUserId)?.nome ?? state.currentUserId}
              </p>
              <select
                value={state.currentUserId}
                onChange={(e) => dispatch({ type: 'SET_CURRENT_USER', userId: e.target.value })}
                className="mt-0.5 w-full cursor-pointer rounded bg-transparent text-xs text-slate-400 outline-none hover:text-slate-200"
              >
                {ALL_USERS.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-800 text-slate-200">
                    {u.nome} — {u.cargo}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Botão recolher */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className="flex items-center justify-center border-t border-slate-800 py-2.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        title={collapsed ? 'Expandir' : 'Recolher'}
      >
        {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
      </button>
    </aside>
  );
}
