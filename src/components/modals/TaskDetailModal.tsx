import { useState } from 'react';
import { Copy, History, Pencil, Trash2, UserCog } from 'lucide-react';
import { useApp, roleOf } from '../../context/AppContext';
import { findUser, NOME_POR_ID } from '../../data/mockData';
import { availableTransitions } from '../../utils/status';
import { formatDate } from '../../utils/date';
import { colaboradorResumo } from '../../utils/tasks';
import Modal from '../modal/Modal';
import ConfirmDialog from '../modal/ConfirmDialog';
import StatusBadge from '../tasks/StatusBadge';
import PriorityBadge from '../tasks/PriorityBadge';
import CycleStepper from '../tasks/CycleStepper';
import DueDateCell from '../tasks/DueDateCell';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { state, dispatch } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const role = roleOf(state.currentUserId);
  const responsavel = findUser(task.responsavelId);
  const criador = findUser(task.criadorId);
  const can = availableTransitions(task.status, role);

  const changeStatus = (novoStatus: typeof task.status) => {
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
    });
    onClose();
  };

  return (
    <>
      <Modal
        open
        title="Detalhes da tarefa"
        onClose={onClose}
        size="lg"
        footer={
        <>
          <button
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'history', taskId: task.id } })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <History className="h-4 w-4" />
            Histórico
          </button>
          {role === 'gestor' && (
            <>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'reassign', taskId: task.id } })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <UserCog className="h-4 w-4" />
                Responsável
              </button>
              <button
                onClick={() =>
                  dispatch({
                    type: 'DUPLICATE_TASK',
                    taskId: task.id,
                    usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
                  })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Copy className="h-4 w-4" />
                Duplicar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </>
          )}
          {can.includes('RECEBIDA') && (
            <button onClick={() => changeStatus('RECEBIDA')} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
              Receber tarefa
            </button>
          )}
          {can.includes('EM_EXECUCAO') && task.status === 'RECEBIDA' && (
            <button onClick={() => changeStatus('EM_EXECUCAO')} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              Iniciar execução
            </button>
          )}
          {task.status === 'DEVOLVIDA' && role === 'colaborador' && (
            <button onClick={() => changeStatus('EM_EXECUCAO')} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
              Retomar após correção
            </button>
          )}
          {task.status === 'CONCLUIDA' && role === 'colaborador' && (
            <button onClick={() => changeStatus('EM_EXECUCAO')} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
              Reabrir tarefa
            </button>
          )}
          {can.includes('CONCLUIDA') && (
            <button onClick={() => changeStatus('CONCLUIDA')} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              Marcar como concluída
            </button>
          )}
          {task.status === 'CONCLUIDA' && role === 'gestor' && (
            <>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'return', taskId: task.id } })}
                className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Devolver
              </button>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'approve', taskId: task.id } })}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Aprovar e finalizar
              </button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">{task.id}</span>
            <StatusBadge status={task.status} />
            <PriorityBadge prioridade={task.prioridade} />
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-800">{task.titulo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.descricao || 'Sem descrição.'}</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ciclo da tarefa</p>
          <CycleStepper status={task.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: responsavel?.cor ?? '#64748b' }}
            >
              {colaboradorResumo(responsavel ?? { nome: '?', cargo: '', email: '', cor: '#64748b', id: '' }).iniciais}
            </span>
            <div>
              <p className="text-[11px] text-slate-400">Responsável</p>
              <p className="font-medium text-slate-700">{responsavel?.nome}</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Criada por</p>
            <p className="font-medium text-slate-700">{criador?.nome}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Criada em</p>
            <p className="font-medium text-slate-700">{formatDate(task.criadaEm)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Prazo</p>
            <DueDateCell task={task} />
          </div>
        </div>
      </div>
      </Modal>
      {confirmDelete && (
        <ConfirmDialog
          open
          danger
          title="Excluir tarefa"
          message={`Excluir permanentemente a tarefa "${task.titulo}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => {
            dispatch({ type: 'DELETE_TASK', taskId: task.id });
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
