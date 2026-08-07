import { Bell, Star } from 'lucide-react';
import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { transicoesDisponiveis } from '../../utils/status';
import { subtarefasProgresso } from '../../utils/tasks';
import PriorityBadge from './PriorityBadge';
import DueDateCell from './DueDateCell';
import CategoryTag from './CategoryTag';
import { cycleActionFor } from './cycleActions';

interface TaskCardProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
}

export default function TaskCard({
  task,
  onConfirmComplete,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const { dispatch } = useApp();
  const progresso = subtarefasProgresso(task);

  const changeStatus = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      onConfirmComplete(task);
      return;
    }
    if (novoStatus === 'ARQUIVADA') {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'archive', taskId: task.id } });
      return;
    }
    if (novoStatus === 'SUSPENSA') {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'suspend', taskId: task.id } });
      return;
    }
    dispatch({ type: 'CHANGE_STATUS', taskId: task.id, novoStatus });
  };

  const action =
    transicoesDisponiveis(task.status)
      .map((target) => cycleActionFor(task, target))
      .find((a) => a !== null) ?? null;

  const openDetail = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="w-full cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800"
    >
      <button
        onClick={openDetail}
        aria-label={`Ver detalhes — ${task.titulo}`}
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{task.titulo}</p>
          <PriorityBadge prioridade={task.prioridade} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">{task.id}</p>
        {(task.categoria || task.projeto || (task.tags && task.tags.length > 0)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {task.categoria && <CategoryTag label={task.categoria} />}
            {task.projeto && <CategoryTag label={`◇ ${task.projeto}`} />}
            {task.tags?.map((t) => <CategoryTag key={t} label={`#${t}`} />)}
          </div>
        )}
        {(progresso.total > 0 || task.lembrete) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {progresso.total > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-500/30"
                title={`Progresso das subtarefas: ${progresso.feitas}/${progresso.total}`}
              >
                {progresso.feitas}/{progresso.total} ✓
              </span>
            )}
            {task.lembrete && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-500/30"
                title={`Lembrete: ${task.lembrete}`}
              >
                <Bell className="h-3 w-3" />
              </span>
            )}
          </div>
        )}
      </button>

      <div className="mt-3 flex items-center justify-between">
        <DueDateCell task={task} />
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })}
            title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            aria-label={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            className={`rounded-lg p-1.5 transition-colors ${
              task.favorita
                ? 'text-amber-500'
                : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500 dark:text-slate-500 dark:hover:bg-amber-950/30'
            }`}
          >
            <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          {action && (
            <button
              onClick={() => changeStatus(action.target)}
              title={action.label}
              aria-label={action.label}
              className={`rounded-lg p-1.5 transition-colors ${action.cls}`}
            >
              <action.icon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
