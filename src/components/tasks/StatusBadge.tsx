import type { TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/status';

const STYLES: Record<TaskStatus, string> = {
  NOVA: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  RECEBIDA: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  EM_EXECUCAO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CONCLUIDA: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  DEVOLVIDA: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  FINALIZADA: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELADA: 'bg-slate-200 text-slate-600 ring-slate-500/20',
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
