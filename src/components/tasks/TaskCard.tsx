import { Star } from 'lucide-react';
import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '../../types';
import { useApp, roleOf } from '../../context/AppContext';
import { findUser, NOME_POR_ID } from '../../data/mockData';
import { availableTransitions } from '../../utils/status';
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
  const { state, dispatch } = useApp();
  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const can = availableTransitions(task.status, role);

  const changeStatus = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      onConfirmComplete(task);
      return;
    }
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
    });
  };

  const action = can.map((target) => cycleActionFor(task, target)).find((a) => a !== null) ?? null;

  const openDetail = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="w-full cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <button
        onClick={openDetail}
        aria-label={`Ver detalhes — ${task.titulo}`}
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">{task.titulo}</p>
          <PriorityBadge prioridade={task.prioridade} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">
          {task.id} · {responsavel?.nome.split(' ')[0]}
        </p>
        {(task.categoria || (task.tags && task.tags.length > 0)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {task.categoria && <CategoryTag label={task.categoria} />}
            {task.tags?.map((t) => <CategoryTag key={t} label={`#${t}`} />)}
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
                : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
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
