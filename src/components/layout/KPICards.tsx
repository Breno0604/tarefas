import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Inbox,
  ListTodo,
  PlayCircle,
  XCircle,
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
    { key: 'total', label: 'Total de tarefas', icon: ClipboardList, value: indicators.total, color: 'bg-slate-100 text-slate-600', active: filters.status.length === 0 && filters.prazo === 'todas' && !filters.search.trim() && !filters.favoritas && filters.categorias.length === 0, onClick: openAll },
    { key: 'caixaEntrada', label: 'Caixa de entrada', icon: Inbox, value: indicators.caixaEntrada, color: 'bg-blue-50 text-blue-600', active: filters.status.includes('CAIXA_ENTRADA'), onClick: () => openWithStatus(['CAIXA_ENTRADA']) },
    { key: 'aFazer', label: 'A fazer', icon: ListTodo, value: indicators.aFazer, color: 'bg-cyan-50 text-cyan-600', active: filters.status.includes('A_FAZER'), onClick: () => openWithStatus(['A_FAZER']) },
    { key: 'emAndamento', label: 'Em andamento', icon: PlayCircle, value: indicators.emAndamento, color: 'bg-amber-50 text-amber-600', active: filters.status.includes('EM_ANDAMENTO'), onClick: () => openWithStatus(['EM_ANDAMENTO']) },
    { key: 'concluidas', label: 'Concluídas', icon: CheckCircle2, value: indicators.concluidas, color: 'bg-emerald-50 text-emerald-600', active: filters.status.includes('CONCLUIDA'), onClick: () => openWithStatus(['CONCLUIDA']) },
    { key: 'canceladas', label: 'Canceladas', icon: XCircle, value: indicators.canceladas, color: 'bg-slate-100 text-slate-600', active: filters.status.includes('CANCELADA'), onClick: () => openWithStatus(['CANCELADA']) },
    { key: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, value: indicators.atrasadas, color: 'bg-red-50 text-red-600', active: filters.prazo === 'vencidas', onClick: openVencidas },
  ];

  return (
    <div>
      <div className="mb-2" aria-hidden="true" />
      {!kpiCollapsed && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.key}
                onClick={kpi.onClick}
                className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:shadow-md ${
                  kpi.active ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
                }`}
              >
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
                  <p className="truncate text-xs text-slate-500">{kpi.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
