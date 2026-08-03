import { ArrowDownToLine, CheckCircle2, Play, RotateCcw, Star } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useApp, roleOf } from '../../context/AppContext';
import { findUser, NOME_POR_ID } from '../../data/mockData';
import { availableTransitions } from '../../utils/status';
import PriorityBadge from './PriorityBadge';
import DueDateCell from './DueDateCell';
import CategoryTag from './CategoryTag';

interface TaskCardProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
}

export default function TaskCard({ task, onConfirmComplete }: TaskCardProps) {
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

  const quickAction = () => {
    if (can.includes('RECEBIDA')) {
      return { icon: ArrowDownToLine, label: 'Receber', target: 'RECEBIDA' as TaskStatus, cls: 'text-cyan-600 hover:bg-cyan-50' };
    }
    if (can.includes('EM_EXECUCAO')) {
      if (task.status === 'DEVOLVIDA')
        return { icon: RotateCcw, label: 'Retomar', target: 'EM_EXECUCAO' as TaskStatus, cls: 'text-rose-600 hover:bg-rose-50' };
      if (task.status === 'CONCLUIDA')
        return { icon: RotateCcw, label: 'Reabrir', target: 'EM_EXECUCAO' as TaskStatus, cls: 'text-rose-600 hover:bg-rose-50' };
      return { icon: Play, label: 'Iniciar', target: 'EM_EXECUCAO' as TaskStatus, cls: 'text-amber-600 hover:bg-amber-50' };
    }
    if (can.includes('CONCLUIDA')) {
      return { icon: CheckCircle2, label: 'Concluir', target: 'CONCLUIDA' as TaskStatus, cls: 'text-violet-600 hover:bg-violet-50' };
    }
    return null;
  };

  const action = quickAction();

  return (
    <button
      onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } })}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md"
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
      <div className="mt-3 flex items-center justify-between">
        <DueDateCell task={task} />
        <div className="flex items-center">
          <span
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id });
            }}
            title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
            className={`rounded-lg p-1.5 transition-colors ${
              task.favorita
                ? 'text-amber-500'
                : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
            }`}
          >
            <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
          </span>
          {action && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                changeStatus(action.target);
              }}
              title={action.label}
              className={`rounded-lg p-1.5 ${action.cls}`}
            >
              <action.icon className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
