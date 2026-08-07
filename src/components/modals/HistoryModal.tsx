import { ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/date';
import Modal from '../modal/Modal';
import StatusBadge from '../tasks/StatusBadge';

interface HistoryModalProps {
  taskId: string;
  onClose: () => void;
}

export default function HistoryModal({ taskId, onClose }: HistoryModalProps) {
  const { state } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const sorted = [...task.historico].sort((a, b) => a.dataHora.localeCompare(b.dataHora));

  return (
    <Modal open title={`Histórico — ${task.titulo}`} onClose={onClose} size="lg">
      <div className="relative space-y-0 pl-6">
        <div className="absolute top-2 bottom-2 left-2 w-px bg-slate-200 dark:bg-slate-700" />
        {sorted.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Nenhum registro de histórico ainda.
          </p>
        )}
        {sorted.map((entry) => (
          <div key={entry.id} className="relative pb-6 pl-4">
            <span
              className={`absolute top-1 -left-[21px] h-3 w-3 rounded-full ring-4 ring-white ${
                entry.tipo === 'status' ? 'bg-indigo-500' : 'bg-slate-400'
              }`}
            />
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{formatDateTime(entry.dataHora)}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {entry.tipo === 'status' ? (
                <>
                  {entry.statusAnterior ? (
                    <StatusBadge status={entry.statusAnterior} />
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">—</span>
                  )}
                  <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {entry.novoStatus ? (
                    <StatusBadge status={entry.novoStatus} />
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">—</span>
                  )}
                </>
              ) : (
                <span className="text-sm text-slate-600 dark:text-slate-300">{entry.observacao}</span>
              )}
            </div>
            {entry.observacao && entry.tipo === 'status' && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{entry.observacao}</p>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
