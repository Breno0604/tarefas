import { useState, type DragEvent } from 'react';
import { Inbox, Lock, Sparkles } from 'lucide-react';
import type { Task } from '../../types';
import TaskRow from './TaskRow';
import TaskCard from './TaskCard';

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

  const mobileCardList = tasks.length === 0 ? null : (
    <div className="space-y-3 p-4 md:hidden">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onConfirmComplete={onConfirmComplete}
        />
      ))}
    </div>
  );

  const mobileEmpty = tasks.length === 0 && (
    <div className="flex flex-col items-center gap-2 py-16 text-slate-400 md:hidden dark:text-slate-500">
      {totalCount === 0 ? (
        <>
          <Sparkles className="h-10 w-10" />
          <p className="text-sm font-medium">Nenhuma tarefa criada ainda</p>
          <p className="text-xs">Clique em "Nova Tarefa" para começar.</p>
        </>
      ) : (
        <>
          <Inbox className="h-10 w-10" />
          <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
          <p className="text-xs">Ajuste a busca ou os filtros para ver mais resultados.</p>
        </>
      )}
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {mobileEmpty}
      {mobileCardList}

      {/* Desktop: table */}
      <div className="hidden md:block">
        {!reorderEnabled && (
          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            Reordenação por arrastar fica disponível sem filtros ou busca — use "Limpar" para limpar os filtros.
          </div>
        )}
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              <th className="px-4 py-3">Tarefa</th>
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
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400 dark:text-slate-500">
              <Sparkles className="h-10 w-10" />
              <p className="text-sm font-medium">Nenhuma tarefa criada ainda</p>
              <p className="text-xs">Clique em "Nova Tarefa" para começar.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400 dark:text-slate-500">
              <Inbox className="h-10 w-10" />
              <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
              <p className="text-xs">Ajuste a busca ou os filtros para ver mais resultados.</p>
            </div>
          ))}
      </div>
    </div>
  );
}
