import {
  ArrowDownToLine,
  CheckCircle2,
  Eye,
  Pencil,
  Play,
  RotateCcw,
  UserCog,
} from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { useApp, roleOf } from '../../context/AppContext';
import { findUser, NOME_POR_ID } from '../../data/mockData';
import { availableTransitions } from '../../utils/status';
import { colaboradorResumo } from '../../utils/tasks';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CycleStepper from './CycleStepper';
import DueDateCell from './DueDateCell';

interface TaskRowProps {
  task: Task;
  onConfirmComplete: (task: Task) => void;
}

export default function TaskRow({ task, onConfirmComplete }: TaskRowProps) {
  const { state, dispatch } = useApp();
  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const can = availableTransitions(task.status, role);

  const openDetail = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: task.id } });
  const openEdit = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } });
  const openReassign = () => dispatch({ type: 'OPEN_MODAL', modal: { type: 'reassign', taskId: task.id } });

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

  const actionFor = (target: TaskStatus) => {
    if (target === 'RECEBIDA')
      return { icon: ArrowDownToLine, label: 'Receber', className: 'text-cyan-600 hover:bg-cyan-50' };
    if (target === 'EM_EXECUCAO')
      return { icon: Play, label: 'Iniciar', className: 'text-amber-600 hover:bg-amber-50' };
    if (target === 'CONCLUIDA')
      return { icon: CheckCircle2, label: 'Concluir', className: 'text-violet-600 hover:bg-violet-50' };
    return null;
  };

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{task.titulo}</p>
          <p className="truncate text-xs text-slate-400">
            {task.id} · {NOME_POR_ID[task.responsavelId]}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: responsavel?.cor ?? '#64748b' }}
          >
            {colaboradorResumo(responsavel ?? { nome: '?', cargo: '', email: '', cor: '#64748b', id: '' }).iniciais}
          </span>
          <span className="text-sm text-slate-600">{responsavel?.nome.split(' ')[0]}</span>
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
        <div className="flex items-center gap-1">
          <button
            onClick={openDetail}
            title="Ver detalhes"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye className="h-4 w-4" />
          </button>
          {role === 'gestor' && (
            <>
              <button
                onClick={openEdit}
                title="Editar"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={openReassign}
                title="Alterar responsável"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <UserCog className="h-4 w-4" />
              </button>
            </>
          )}
          {can.map((target) => {
            const act = actionFor(target);
            if (!act) return null;
            const Icon = act.icon;
            return (
              <button
                key={target}
                onClick={() => changeStatus(target)}
                title={act.label}
                className={`rounded-lg p-1.5 transition-colors ${act.className}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          {task.status === 'DEVOLVIDA' && role === 'colaborador' && (
            <button
              onClick={() => changeStatus('EM_EXECUCAO')}
              title="Retomar"
              className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
