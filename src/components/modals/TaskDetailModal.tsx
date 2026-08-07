import { useState } from 'react';
import { Copy, History, Pencil, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { transicoesDisponiveis } from '../../utils/status';
import { formatDate, formatDateTime } from '../../utils/date';
import Modal from '../modal/Modal';
import ConfirmDialog from '../modal/ConfirmDialog';
import StatusBadge from '../tasks/StatusBadge';
import PriorityBadge from '../tasks/PriorityBadge';
import CycleStepper from '../tasks/CycleStepper';
import DueDateCell from '../tasks/DueDateCell';
import CategoryTag from '../tasks/CategoryTag';
import { cycleActionFor } from '../tasks/cycleActions';
import type { TaskStatus } from '../../types';

const iconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700';

const dangerIconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-300 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { state, dispatch } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConcluir, setConfirmConcluir] = useState(false);
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const changeStatus = (novoStatus: TaskStatus) => {
    dispatch({ type: 'CHANGE_STATUS', taskId: task.id, novoStatus });
    onClose();
  };

  const onClickTransicao = (novoStatus: TaskStatus) => {
    if (novoStatus === 'CONCLUIDA') {
      setConfirmConcluir(true);
      return;
    }
    if (novoStatus === 'CANCELADA') {
      dispatch({ type: 'OPEN_MODAL', modal: { type: 'cancel', taskId: task.id } });
      onClose();
      return;
    }
    changeStatus(novoStatus);
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
              aria-label="Histórico"
              title="Histórico"
              className={iconButton}
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'edit', taskId: task.id } })}
              aria-label="Editar"
              title="Editar"
              className={iconButton}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => dispatch({ type: 'DUPLICATE_TASK', taskId: task.id })}
              aria-label="Duplicar"
              title="Duplicar"
              className={iconButton}
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Excluir"
              title="Excluir"
              className={dangerIconButton}
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
                  onClick={() => onClickTransicao(target)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${act.cls}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {act.label}
                  </span>
                </button>
              );
            })}
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">{task.id}</span>
              <StatusBadge status={task.status} />
              <PriorityBadge prioridade={task.prioridade} />
              <button
                onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })}
                title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
                className={`ml-auto rounded-lg p-1.5 transition-colors ${
                  task.favorita
                    ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-600'
                    : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500'
                }`}
              >
                <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-800">{task.titulo}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.descricao || 'Sem descrição.'}</p>
            {(task.categoria || (task.tags && task.tags.length > 0)) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {task.categoria && <CategoryTag label={task.categoria} />}
                {task.tags?.map((t) => <CategoryTag key={t} label={`#${t}`} />)}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Ciclo da tarefa</p>
            <CycleStepper status={task.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-slate-400">Criada em</p>
              <p className="font-medium text-slate-700">{formatDate(task.criadaEm)}</p>
              {task.atualizadaEm && task.atualizadaEm !== task.criadaEm && (
                <p className="text-xs text-slate-400">atualizada em {formatDateTime(task.atualizadaEm)}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Prazo</p>
              <DueDateCell task={task} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Concluída em</p>
              <p className="font-medium text-slate-700">
                {task.concluidaEm ? formatDateTime(task.concluidaEm) : '—'}
              </p>
            </div>
          </div>
        </div>
      </Modal>
      {confirmDelete && (
        <ConfirmDialog
          open
          danger
          title="Excluir tarefa"
          message={`Excluir a tarefa "${task.titulo}"? Você poderá desfazer pelo aviso exibido em seguida.`}
          confirmLabel="Excluir"
          onConfirm={() => {
            dispatch({ type: 'DELETE_TASK', taskId: task.id });
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
      {confirmConcluir && (
        <ConfirmDialog
          open
          title="Confirmar conclusão"
          message={`Marcar a tarefa "${task.titulo}" como concluída?`}
          confirmLabel="Concluir"
          onConfirm={() => changeStatus('CONCLUIDA')}
          onClose={() => setConfirmConcluir(false)}
        />
      )}
    </>
  );
}
