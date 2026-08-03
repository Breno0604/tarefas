import type { Task, TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/status';
import StatusBadge from './StatusBadge';
import TaskCard from './TaskCard';

const COLUMNS: TaskStatus[] = ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA', 'FINALIZADA'];

interface TaskKanbanProps {
  tasks: Task[];
  onConfirmComplete: (task: Task) => void;
}

export default function TaskKanban({ tasks, onConfirmComplete }: TaskKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="flex min-w-[240px] flex-1 flex-col rounded-xl bg-slate-200/60 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <StatusBadge status={status} />
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onConfirmComplete={onConfirmComplete} />
              ))}
              {columnTasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                  {STATUS_LABELS[status]} — vazio
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
