import { AlertTriangle, CalendarClock } from 'lucide-react';
import type { Task } from '../../types';
import { formatDate, isOverdue } from '../../utils/date';

export default function DueDateCell({ task }: { task: Task }) {
  if (!task.prazo) return <span className="text-sm text-slate-400 dark:text-slate-500">Sem prazo</span>;
  const overdue = isOverdue(task.prazo, task.status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${
        overdue
          ? 'font-medium text-rose-600 dark:text-rose-400'
          : 'text-slate-600 dark:text-slate-300'
      }`}
    >
      {overdue ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <CalendarClock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      )}
      {formatDate(task.prazo)}
    </span>
  );
}
