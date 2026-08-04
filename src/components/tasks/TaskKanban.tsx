import { useState, type DragEvent } from 'react';
import { Ban, Inbox, Sparkles } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { roleOf } from '../../utils/status';
import { podeAlterarStatus } from '../../utils/permissions';
import { NOME_POR_ID } from '../../data/mockData';
import { canTransition, STATUS_LABELS } from '../../utils/status';
import StatusBadge from './StatusBadge';
import TaskCard from './TaskCard';

const COLUMNS: TaskStatus[] = ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA', 'FINALIZADA'];

interface TaskKanbanProps {
  tasks: Task[];
  totalCount: number;
  onConfirmComplete: (task: Task) => void;
}

interface DragInfo {
  id: string;
  status: TaskStatus;
}

export default function TaskKanban({ tasks, totalCount, onConfirmComplete }: TaskKanbanProps) {
  const { state, dispatch } = useApp();
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

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

  const role = roleOf(state.currentUserId);

  const handleDragStart = (taskId: string) => (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    const dragged = state.tasks.find((t) => t.id === taskId);
    if (dragged) setDragInfo({ id: dragged.id, status: dragged.status });
  };

  const canDropOn = (status: TaskStatus): boolean => {
    if (!dragInfo) return true;
    const dragged = state.tasks.find((t) => t.id === dragInfo.id);
    if (!dragged) return false;
    return podeAlterarStatus(state.currentUserId, dragged) && canTransition(dragInfo.status, status, role);
  };

  const handleDragOver = (status: TaskStatus) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = canDropOn(status) ? 'move' : 'none';
    setOverStatus(status);
  };

  const handleDrop = (status: TaskStatus) => (e: DragEvent) => {
    e.preventDefault();
    setOverStatus(null);
    setDragInfo(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const dragged = state.tasks.find((t) => t.id === taskId);
    if (!dragged || dragged.status === status) return;
    if (!podeAlterarStatus(state.currentUserId, dragged)) return;
    if (!canTransition(dragged.status, status, role)) return;
    dispatch({
      type: 'CHANGE_STATUS',
      taskId,
      novoStatus: status,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
    });
  };

  const handleDragEnd = () => {
    setOverStatus(null);
    setDragInfo(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const isOver = overStatus === status;
        const allowed = canDropOn(status);
        const highlight = isOver ? (allowed ? 'indigo' : 'blocked') : null;
        return (
          <div
            key={status}
            onDragOver={handleDragOver(status)}
            onDrop={handleDrop(status)}
            onDragEnd={handleDragEnd}
            className={`flex min-w-[240px] flex-1 flex-col rounded-xl p-2 transition-colors ${
              highlight === 'indigo'
                ? 'bg-indigo-100/70 ring-2 ring-inset ring-indigo-300'
                : highlight === 'blocked'
                  ? 'bg-rose-100/70 ring-2 ring-inset ring-rose-300'
                  : 'bg-slate-200/60'
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <StatusBadge status={status} />
                {highlight === 'blocked' && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700"
                    title="Transição não permitida para o papel atual"
                  >
                    <Ban className="h-3 w-3" />
                    não permitido
                  </span>
                )}
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onConfirmComplete={onConfirmComplete}
                  onDragStart={handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                />
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
