import { useState, type DragEvent } from 'react';
import { Inbox, Sparkles } from 'lucide-react';
import type { Task } from '../../types';
import TaskRow from './TaskRow';

interface TasksTableProps {
  tasks: Task[];
  totalCount: number;
  onConfirmComplete: (task: Task) => void;
  onDeleteRequest: (task: Task) => void;
  reorderEnabled: boolean;
  onReorder: (taskId: string, toTaskId: string) => void;
}

export default function TasksTable({
  tasks,
  totalCount,
  onConfirmComplete,
  onDeleteRequest,
  reorderEnabled,
  onReorder,
}: TasksTableProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = (id: string) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDragId(id);
  };

  const handleDragOver = (id: string) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(id);
  };

  const handleDrop = (id: string) => () => {
    if (dragId && dragId !== id) onReorder(dragId, id);
    setDragId(null);
    setOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

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
            <TaskRow
              key={task.id}
              task={task}
              onConfirmComplete={onConfirmComplete}
              onDeleteRequest={onDeleteRequest}
              draggable={reorderEnabled}
              isDragging={dragId === task.id}
              isDropTarget={overId === task.id && dragId !== task.id}
              onDragStart={handleDragStart(task.id)}
              onDragOver={handleDragOver(task.id)}
              onDrop={handleDrop(task.id)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </tbody>
      </table>
      {tasks.length === 0 &&
        (totalCount === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <Sparkles className="h-10 w-10" />
            <p className="text-sm font-medium">Nenhuma tarefa criada ainda</p>
            <p className="text-xs">Clique em "Nova Tarefa" para começar.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <Inbox className="h-10 w-10" />
            <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
            <p className="text-xs">Ajuste a busca ou os filtros para ver mais resultados.</p>
          </div>
        ))}
    </div>
  );
}
