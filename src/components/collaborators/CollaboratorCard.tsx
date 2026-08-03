import { AlertTriangle, CheckCircle2, ListChecks, TrendingUp } from 'lucide-react';
import type { Colaborador } from '../../types';
import { useApp } from '../../context/AppContext';
import { colaboradorMetrics, colaboradorResumo } from '../../utils/tasks';

export default function CollaboratorCard({ colaborador }: { colaborador: Colaborador }) {
  const { state, dispatch } = useApp();
  const m = colaboradorMetrics(colaborador.id, state.tasks);
  const iniciais = colaboradorResumo(colaborador.nome).iniciais;

  const open = () =>
    dispatch({ type: 'OPEN_MODAL', modal: { type: 'colaborador', colaboradorId: colaborador.id } });

  return (
    <button
      onClick={open}
      className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: colaborador.cor }}
        >
          {iniciais}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{colaborador.nome}</p>
          <p className="truncate text-xs text-slate-500">{colaborador.cargo}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <ListChecks className="h-4 w-4 text-indigo-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.ativas}</p>
            <p className="text-[11px] text-slate-500">Ativas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.concluidas}</p>
            <p className="text-[11px] text-slate-500">Finalizadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.atrasadas}</p>
            <p className="text-[11px] text-slate-500">Atrasadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-cyan-500" />
          <div>
            <p className="text-sm font-bold text-slate-800">{m.taxaConclusao}%</p>
            <p className="text-[11px] text-slate-500">Conclusão</p>
          </div>
        </div>
      </div>
    </button>
  );
}
