import type { Priority } from '../../types';
import { PRIORITY_LABELS } from '../../utils/status';

const STYLES: Record<Priority, string> = {
  baixa: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  media: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  alta: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  critica: 'bg-rose-50 text-rose-700 ring-rose-600/20',
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
