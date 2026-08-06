import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  CircleDot,
  ClipboardList,
  Hourglass,
  Inbox,
  PlayCircle,
  RotateCcw,
  TimerOff,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openTarefas } from '../../context/navigation';
import { PARADAS_MIN_DIAS, type Indicators } from '../../utils/tasks';
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

const COLLAPSED_KEY = 'kpiCollapsed';

export default function KPICards({ indicators }: { indicators: Indicators }) {
  const { state, dispatch } = useApp();
  const { filters } = state;
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(COLLAPSED_KEY) === '1');

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const openWithStatus = (statuses: TaskStatus[]) => openTarefas(dispatch, { status: statuses });
  const openVencidas = () => openTarefas(dispatch, { prazo: 'vencidas' });
  const openComRetrabalho = () => openTarefas(dispatch, { comRetrabalho: true });
  const openParadas = () => openTarefas(dispatch, { paradas: PARADAS_MIN_DIAS });
  const openAll = () => openTarefas(dispatch);

  const kpis: KpiDef[] = [
    { key: 'total', label: 'Total de tarefas', icon: ClipboardList, value: indicators.total, color: 'bg-slate-100 text-slate-600', active: filters.status.length === 0 && filters.prazo === 'todas', onClick: openAll },
    { key: 'novas', label: 'Novas', icon: Inbox, value: indicators.novas, color: 'bg-blue-50 text-blue-600', active: filters.status.includes('NOVA'), onClick: () => openWithStatus(['NOVA']) },
    { key: 'recebidas', label: 'Recebidas', icon: CircleDashed, value: indicators.recebidas, color: 'bg-cyan-50 text-cyan-600', active: filters.status.includes('RECEBIDA'), onClick: () => openWithStatus(['RECEBIDA']) },
    { key: 'emExecucao', label: 'Em execução', icon: PlayCircle, value: indicators.emExecucao, color: 'bg-amber-50 text-amber-600', active: filters.status.includes('EM_EXECUCAO'), onClick: () => openWithStatus(['EM_EXECUCAO']) },
    { key: 'aguardandoAprovacao', label: 'Aguardando aprovação', icon: Hourglass, value: indicators.aguardandoAprovacao, color: 'bg-violet-50 text-violet-600', active: filters.status.length === 1 && filters.status[0] === 'CONCLUIDA', onClick: () => openWithStatus(['CONCLUIDA']) },
    { key: 'concluidas', label: 'Concluídas', icon: CircleDot, value: indicators.concluidas, color: 'bg-indigo-50 text-indigo-600', active: filters.status.length > 0 && filters.status.every((s) => s === 'CONCLUIDA' || s === 'FINALIZADA'), onClick: () => openWithStatus(['CONCLUIDA', 'FINALIZADA']) },
    { key: 'devolvidas', label: 'Devolvidas', icon: Undo2, value: indicators.devolvidas, color: 'bg-rose-50 text-rose-600', active: filters.status.includes('DEVOLVIDA'), onClick: () => openWithStatus(['DEVOLVIDA']) },
    { key: 'finalizadas', label: 'Finalizadas', icon: CheckCircle2, value: indicators.finalizadas, color: 'bg-emerald-50 text-emerald-600', active: filters.status.includes('FINALIZADA'), onClick: () => openWithStatus(['FINALIZADA']) },
    { key: 'canceladas', label: 'Canceladas', icon: XCircle, value: indicators.canceladas, color: 'bg-slate-100 text-slate-600', active: filters.status.includes('CANCELADA'), onClick: () => openWithStatus(['CANCELADA']) },
    { key: 'devolucoes', label: 'Devoluções', icon: RotateCcw, value: indicators.devolucoes, color: 'bg-rose-100 text-rose-700', active: filters.comRetrabalho, onClick: openComRetrabalho },
    { key: 'paradas', label: 'Paradas', icon: TimerOff, value: indicators.paradas, color: 'bg-orange-50 text-orange-600', active: filters.paradas !== null, onClick: openParadas },
    { key: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, value: indicators.atrasadas, color: 'bg-red-50 text-red-600', active: filters.prazo === 'vencidas', onClick: openVencidas },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Indicadores</h2>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir indicadores' : 'Recolher indicadores'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {!collapsed && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
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
