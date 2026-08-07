import type { Priority } from '../../types';
import { PRIORITY_LABELS } from '../../utils/status';

const STYLES: Record<Priority, string> = {
  baixa: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/60 dark:text-slate-300 dark:ring-slate-500/40',
  media: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-500/30',
  alta: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-500/30',
  critica: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-500/30',
};

export default function PriorityBadge({ prioridade }: { prioridade: Priority }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[prioridade]}`}
    >
      {PRIORITY_LABELS[prioridade]}
    </span>
  );
}
