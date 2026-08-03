import { Inbox } from 'lucide-react';
import type { Task } from '../../types';
import TaskRow from './TaskRow';

interface TasksTableProps {
  tasks: Task[];
  onConfirmComplete: (task: Task) => void;
}

export default function TasksTable({ tasks, onConfirmComplete }: TasksTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Tarefa</th>
            <th className="px-4 py-3">Responsável</th>
            <th className="px-4 py-3">Prioridade</th>
            <th className="px-4 py-3">Prazo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Ciclo</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onConfirmComplete={onConfirmComplete} />
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <Inbox className="h-10 w-10" />
          <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
          <p className="text-xs">Ajuste a busca ou os filtros para ver mais resultados.</p>
        </div>
      )}
    </div>
  );
}
