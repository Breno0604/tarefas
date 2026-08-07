import { Copy, Eye, GripVertical, Pencil, Star, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';
import type { Task, TaskStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { transicoesDisponiveis } from '../../utils/status';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CycleStepper from './CycleStepper';
import DueDateCell from './DueDateCell';
import { cycleActionFor } from './cycleActions';

interface TaskRowProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
  onDeleteRequest: (task: Task) => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export default function TaskRow({
  task,
  onConfirmComplete,
  onDeleteRequest,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TaskRowProps) {
  const { dispatch } = useApp();

  const openDetail = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } });
  const openEdit = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } });

  const changeStatus = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      onConfirmComplete(task);
      return;
    }
    if (novoStatus === 'CANCELADA') {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'cancel', taskId: task.id } });
      return;
    }
    dispatch({ type: 'CHANGE_STATUS', taskId: task.id, novoStatus });
  };

  return (
    <tr
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${
        isDragging ? 'opacity-40' : ''
      } ${isDropTarget ? 'bg-indigo-50/60 ring-2 ring-inset ring-indigo-300' : ''}`}
    >
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            title={draggable ? undefined : 'Remova filtros e ordenação para reordenar'}
            className="shrink-0"
          >
            <GripVertical
              className={`h-4 w-4 ${
                draggable ? 'cursor-grab text-slate-300' : 'cursor-not-allowed text-slate-200'
              }`}
              aria-hidden
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{task.titulo}</p>
            <p className="truncate text-xs text-slate-400">{task.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <PriorityBadge prioridade={task.prioridade} />
      </td>
      <td className="px-4 py-3">
        <DueDateCell task={task} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-4 py-3">
        <CycleStepper status={task.status} compact />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={openDetail}
            aria-label="Ver detalhes"
            title="Ver detalhes"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })}
            aria-label={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            className={`rounded-lg p-1.5 transition-colors ${
              task.favorita
                ? 'text-amber-500'
                : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
            }`}
          >
            <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          <button
            onClick={openEdit}
            aria-label="Editar"
            title="Editar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'DUPLICATE_TASK', taskId: task.id })
            }
            aria-label="Duplicar"
            title="Duplicar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteRequest(task)}
            aria-label="Excluir"
            title="Excluir"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {transicoesDisponiveis(task.status).map((target) => {
            const act = cycleActionFor(task, target);
            if (!act) return null;
            const Icon = act.icon;
            return (
              <button
                key={target}
                onClick={() => changeStatus(target)}
                title={act.label}
                className={`rounded-lg p-1.5 transition-colors ${act.cls}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
