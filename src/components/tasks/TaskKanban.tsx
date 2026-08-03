import { Inbox, Sparkles } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/status';
import StatusBadge from './StatusBadge';
import TaskCard from './TaskCard';

const COLUMNS: TaskStatus[] = ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA', 'FINALIZADA'];

interface TaskKanbanProps {
  tasks: Task[];
  totalCount: number;
  onConfirmComplete: (task: Task) => void;
}

export default function TaskKanban({ tasks, totalCount, onConfirmComplete }: TaskKanbanProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-400 shadow-sm">
        {totalCount === 0 ? <Sparkles className="h-10 w-10" /> : <Inbox className="h-10 w-10" />}
        <p className="text-sm font-medium">
          {totalCount === 0 ? 'Nenhuma tarefa criada ainda' : 'Nenhuma tarefa encontrada'}
        </p>
        <p className="text-xs">
          {totalCount === 0
            ? 'Clique em "Nova Tarefa" para começar.'
            : 'Ajuste a busca ou os filtros para ver mais resultados.'}
        </p>
      </div>
    );
  }

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
