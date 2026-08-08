import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardList,
  Inbox,
  ListTodo,
  PauseCircle,
  PlayCircle,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openTarefas } from '../../context/navigation';
import type { Indicators } from '../../utils/tasks';
import type { TaskStatus } from '../../types';

interface KpiDef {
  key: string;
  label: string;
  icon: LucideIcon;
  value: number;
  color: string; // bg do ícone
  active: boolean;
  onClick: () => void;
}

export default function KPICards({ indicators }: { indicators: Indicators }) {
  const { state, dispatch } = useApp();
  const { filters, kpiCollapsed } = state;

  const openWithStatus = (statuses: TaskStatus[]) => openTarefas(dispatch, { status: statuses });
  const openVencidas = () => openTarefas(dispatch, { prazo: 'vencidas' });
  const openAll = () => openTarefas(dispatch);

  const kpis: KpiDef[] = [
    { key: 'total', label: 'Total de tarefas', icon: ClipboardList, value: indicators.total, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', active: filters.status.length === 0 && filters.prazo === 'todas' && !filters.search.trim() && !filters.favoritas && filters.categorias.length === 0, onClick: openAll },
    { key: 'caixaEntrada', label: 'Caixa de entrada', icon: Inbox, value: indicators.caixaEntrada, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400', active: filters.status.includes('CAIXA_ENTRADA'), onClick: () => openWithStatus(['CAIXA_ENTRADA']) },
    { key: 'aFazer', label: 'A fazer', icon: ListTodo, value: indicators.aFazer, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400', active: filters.status.includes('A_FAZER'), onClick: () => openWithStatus(['A_FAZER']) },
    { key: 'emAndamento', label: 'Em andamento', icon: PlayCircle, value: indicators.emAndamento, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400', active: filters.status.includes('EM_ANDAMENTO'), onClick: () => openWithStatus(['EM_ANDAMENTO']) },
    { key: 'suspensas', label: 'Suspensas', icon: PauseCircle, value: indicators.suspensas, color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400', active: filters.status.includes('SUSPENSA'), onClick: () => openWithStatus(['SUSPENSA']) },
    { key: 'concluidas', label: 'Concluídas', icon: CheckCircle2, value: indicators.concluidas, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400', active: filters.status.includes('CONCLUIDA'), onClick: () => openWithStatus(['CONCLUIDA']) },
    { key: 'arquivadas', label: 'Arquivadas', icon: Archive, value: indicators.arquivadas, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', active: filters.status.includes('ARQUIVADA'), onClick: () => openWithStatus(['ARQUIVADA']) },
    { key: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, value: indicators.atrasadas, color: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400', active: filters.prazo === 'vencidas', onClick: openVencidas },
  ];

  return (
    <div>
      <div className="mb-2" aria-hidden="true" />
      {!kpiCollapsed && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.key}
                onClick={kpi.onClick}
                className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:shadow-md dark:bg-slate-800 ${
                  kpi.active
                    ? 'border-indigo-400 ring-2 ring-indigo-100 dark:border-indigo-500 dark:ring-indigo-950/60'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{kpi.value}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
