import {
  LayoutDashboard,
  ListChecks,
  Users,
  AlertTriangle,
  CheckCircle2,
  Undo2,
  X,
} from 'lucide-react';
import { ALL_USERS, COLABORADORES, findUser, GESTOR } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { openTarefas } from '../../context/navigation';
import { colaboradorMetrics } from '../../utils/tasks';
import { tasksVisiveis } from '../../utils/permissions';
import Avatar from '../ui/Avatar';
import type { Section } from '../../types';

const NAV: { section: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { section: 'visaoGeral', label: 'Visão Geral', icon: LayoutDashboard },
  { section: 'tarefas', label: 'Tarefas', icon: ListChecks },
  { section: 'colaboradores', label: 'Colaboradores', icon: Users },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const open = state.sidebarOpen;

  const close = () => dispatch({ type: 'TOGGLE_SIDEBAR' });

  const goTo = (section: Section) => {
    dispatch({ type: 'SET_SECTION', section });
    if (open) close();
  };

  const atalhos = [
    {
      label: 'Atrasadas',
      icon: AlertTriangle,
      onClick: () => {
        openTarefas(dispatch, { prazo: 'vencidas' });
        if (open) close();
      },
    },
    {
      label: 'Finalizadas',
      icon: CheckCircle2,
      onClick: () => {
        openTarefas(dispatch, { status: ['FINALIZADA'] });
        if (open) close();
      },
    },
    {
      label: 'Devolvidas',
      icon: Undo2,
      onClick: () => {
        openTarefas(dispatch, { status: ['DEVOLVIDA'] });
        if (open) close();
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={close}
        />
      )}
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
            TF
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">TaskFlow</p>
            <p className="truncate text-xs text-slate-400">Gestão de Tarefas</p>
          </div>
          <button
            onClick={close}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = state.section === item.section;
            return (
              <button
                key={item.section}
                onClick={() => goTo(item.section)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-500/20 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Atalhos
          </div>
          {atalhos.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={a.onClick}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{a.label}</span>
              </button>
            );
          })}

          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Colaboradores
          </div>
          {COLABORADORES.map((c) => {
            const metrics = colaboradorMetrics(c.id, tasksVisiveis(state.tasks, state.currentUserId));
            return (
              <button
                key={c.id}
                onClick={() => {
                  goTo('colaboradores');
                  dispatch({ type: 'OPEN_MODAL', modal: { type: 'colaborador', colaboradorId: c.id } });
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-800"
              >
                <Avatar nome={c.nome} cor={c.cor} size="xs" />
                <span className="flex min-w-0 flex-1 items-center justify-between">
                  <span className="truncate text-slate-300">{c.nome.split(' ')[0]}</span>
                  {metrics.ativas > 0 && (
                    <span className="ml-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {metrics.ativas}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Usuário atual */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                nome={(findUser(state.currentUserId) ?? GESTOR).nome}
                cor={findUser(state.currentUserId)?.cor ?? '#64748b'}
                size="md"
              />
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
            </div>
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
          </div>
        </div>
      </aside>
    </>
  );
}
