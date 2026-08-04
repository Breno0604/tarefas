import { useMemo } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NOME_POR_ID } from '../../data/mockData';
import { EMPTY_FILTERS, computeIndicators, filterTasks } from '../../utils/tasks';
import { tasksVisiveis } from '../../utils/permissions';
import { formatDate } from '../../utils/date';
import KPICards from '../layout/KPICards';

export default function SectionVisaoGeral() {
  const { state } = useApp();
  const visiveis = useMemo(
    () => tasksVisiveis(state.tasks, state.currentUserId),
    [state.tasks, state.currentUserId]
  );
  const indicators = useMemo(() => computeIndicators(visiveis), [visiveis]);
  const atrasadas = useMemo(
    () => filterTasks(visiveis, { ...EMPTY_FILTERS, prazo: 'vencidas' }, NOME_POR_ID).slice(0, 5),
    [visiveis]
  );
  const proximas = useMemo(
    () =>
      visiveis
        .filter((t) => t.prazo !== null && t.status !== 'FINALIZADA' && t.status !== 'CONCLUIDA')
        .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''))
        .slice(0, 5),
    [visiveis]
  );

  return (
    <div className="space-y-6">
      <KPICards indicators={indicators} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-700">Atrasadas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {atrasadas.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma tarefa atrasada.</p>
            )}
            {atrasadas.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{t.titulo}</p>
                  <p className="text-xs text-slate-400">{NOME_POR_ID[t.responsavelId]}</p>
                </div>
                <span className="text-xs font-semibold text-rose-600">
                  {t.prazo ? formatDate(t.prazo) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Clock className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Próximos prazos</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {proximas.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum prazo próximo.</p>
            )}
            {proximas.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{t.titulo}</p>
                  <p className="text-xs text-slate-400">{NOME_POR_ID[t.responsavelId]}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {t.prazo ? formatDate(t.prazo) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
