import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  ClipboardList,
  Inbox,
  PlayCircle,
  Undo2,
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
  const { filters } = state;

  const openWithStatus = (statuses: TaskStatus[]) => openTarefas(dispatch, { status: statuses });
  const openVencidas = () => openTarefas(dispatch, { prazo: 'vencidas' });
  const openAll = () => openTarefas(dispatch);

  const kpis: KpiDef[] = [
    { key: 'total', label: 'Total de tarefas', icon: ClipboardList, value: indicators.total, color: 'bg-slate-100 text-slate-600', active: filters.status.length === 0 && filters.prazo === 'todas', onClick: openAll },
    { key: 'novas', label: 'Novas', icon: Inbox, value: indicators.novas, color: 'bg-blue-50 text-blue-600', active: filters.status.includes('NOVA'), onClick: () => openWithStatus(['NOVA']) },
    { key: 'recebidas', label: 'Recebidas', icon: CircleDashed, value: indicators.recebidas, color: 'bg-cyan-50 text-cyan-600', active: filters.status.includes('RECEBIDA'), onClick: () => openWithStatus(['RECEBIDA']) },
    { key: 'emExecucao', label: 'Em execução', icon: PlayCircle, value: indicators.emExecucao, color: 'bg-amber-50 text-amber-600', active: filters.status.includes('EM_EXECUCAO'), onClick: () => openWithStatus(['EM_EXECUCAO']) },
    { key: 'concluidas', label: 'Concluídas', icon: CircleDot, value: indicators.concluidas, color: 'bg-violet-50 text-violet-600', active: filters.status.includes('CONCLUIDA'), onClick: () => openWithStatus(['CONCLUIDA']) },
    { key: 'devolvidas', label: 'Devolvidas', icon: Undo2, value: indicators.devolvidas, color: 'bg-rose-50 text-rose-600', active: filters.status.includes('DEVOLVIDA'), onClick: () => openWithStatus(['DEVOLVIDA']) },
    { key: 'finalizadas', label: 'Finalizadas', icon: CheckCircle2, value: indicators.finalizadas, color: 'bg-emerald-50 text-emerald-600', active: filters.status.includes('FINALIZADA'), onClick: () => openWithStatus(['FINALIZADA']) },
    { key: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, value: indicators.atrasadas, color: 'bg-red-50 text-red-600', active: filters.prazo === 'vencidas', onClick: openVencidas },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
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
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">Conclusão geral</span>
          <span className="font-semibold text-slate-700">{indicators.percentConclusao}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${indicators.percentConclusao}%` }}
          />
        </div>
      </div>
    </div>
  );
}
