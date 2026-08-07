import { useState } from 'react';
import { Bell, Copy, History, Pencil, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { transicoesDisponiveis } from '../../utils/status';
import { formatDate, formatDateTime } from '../../utils/date';
import { subtarefasProgresso } from '../../utils/tasks';
import type { Recorrencia, TaskStatus } from '../../types';
import Modal from '../modal/Modal';
import ConfirmDialog from '../modal/ConfirmDialog';
import StatusBadge from '../tasks/StatusBadge';
import PriorityBadge from '../tasks/PriorityBadge';
import CycleStepper from '../tasks/CycleStepper';
import DueDateCell from '../tasks/DueDateCell';
import CategoryTag from '../tasks/CategoryTag';
import { cycleActionFor } from '../tasks/cycleActions';

const iconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700';

const dangerIconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-300 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800/60 dark:text-rose-400 dark:hover:bg-rose-950/40';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40';

const RECORRENCIA_LABELS: Record<Recorrencia, string> = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { state, dispatch } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConcluir, setConfirmConcluir] = useState(false);
  const [novaSubtarefa, setNovaSubtarefa] = useState('');
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const progresso = subtarefasProgresso(task);

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

  const addSubtarefa = () => {
    if (!novaSubtarefa.trim()) return;
    dispatch({ type: 'ADD_SUBTAREFA', taskId: task.id, titulo: novaSubtarefa });
    setNovaSubtarefa('');
  };

  const addAnotacao = () => {
    if (!novaAnotacao.trim()) return;
    dispatch({ type: 'ADD_ANOTACAO', taskId: task.id, texto: novaAnotacao });
    setNovaAnotacao('');
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
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{task.id}</span>
              <StatusBadge status={task.status} />
              <PriorityBadge prioridade={task.prioridade} />
              {task.recorrencia && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-500/30"
                  title="Tarefa recorrente"
                >
                  <RefreshCw className="h-3 w-3" />
                  {RECORRENCIA_LABELS[task.recorrencia]}
                </span>
              )}
              <button
                onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', taskId: task.id })}
                title={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
                aria-label={task.favorita ? 'Remover dos favoritos' : 'Favoritar'}
                className={`ml-auto rounded-lg p-1.5 transition-colors ${
                  task.favorita
                    ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-950/40'
                    : 'text-slate-400 hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-950/30'
                }`}
              >
                <Star className={`h-4 w-4 ${task.favorita ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{task.titulo}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {task.descricao || 'Sem descrição.'}
            </p>
            {(task.categoria || task.projeto || (task.tags && task.tags.length > 0)) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {task.categoria && <CategoryTag label={task.categoria} />}
                {task.projeto && <CategoryTag label={`◇ ${task.projeto}`} />}
                {task.tags?.map((t) => <CategoryTag key={t} label={`#${t}`} />)}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ciclo da tarefa</p>
            <CycleStepper status={task.status} />
          </div>

          {/* Subtarefas / checklist */}
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subtarefas
              </p>
              {progresso.total > 0 && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {progresso.feitas}/{progresso.total}
                </span>
              )}
            </div>
            {progresso.total > 0 && (
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${progresso.pct}%` }}
                />
              </div>
            )}
            <ul className="space-y-1.5">
              {(task.subtarefas ?? []).map((s) => (
                <li key={s.id} className="group flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-white dark:hover:bg-slate-700/50">
                  <input
                    type="checkbox"
                    checked={s.concluida}
                    onChange={() => dispatch({ type: 'TOGGLE_SUBTAREFA', taskId: task.id, subtarefaId: s.id })}
                    className="h-4 w-4 shrink-0 rounded accent-indigo-600"
                    aria-label={`Alternar subtarefa: ${s.titulo}`}
                  />
                  <span
                    className={`min-w-0 flex-1 text-sm ${
                      s.concluida
                        ? 'text-slate-400 line-through dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {s.titulo}
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_SUBTAREFA', taskId: task.id, subtarefaId: s.id })}
                    aria-label={`Remover subtarefa: ${s.titulo}`}
                    className="rounded p-1 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            {progresso.total === 0 && (
              <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
                Quebre a tarefa em passos menores para acompanhar o progresso.
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <input
                value={novaSubtarefa}
                onChange={(e) => setNovaSubtarefa(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSubtarefa();
                }}
                placeholder="Nova subtarefa..."
                aria-label="Nova subtarefa"
                className={inputCls}
              />
              <button
                onClick={addSubtarefa}
                disabled={!novaSubtarefa.trim()}
                aria-label="Adicionar subtarefa"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Anotações personalizadas */}
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Anotações
            </p>
            <ul className="space-y-2">
              {(task.anotacoes ?? []).map((n) => (
                <li key={n.id} className="group rounded-md bg-white p-3 ring-1 ring-slate-200/70 dark:bg-slate-700/60 dark:ring-slate-600/60">
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{n.texto}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatDateTime(n.criadaEm)}
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_ANOTACAO', taskId: task.id, anotacaoId: n.id })}
                      aria-label="Remover anotação"
                      className="rounded p-1 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <textarea
              value={novaAnotacao}
              onChange={(e) => setNovaAnotacao(e.target.value)}
              rows={2}
              placeholder="Escreva uma anotação pessoal sobre esta tarefa..."
              aria-label="Nova anotação"
              className={`${inputCls} mt-2`}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={addAnotacao}
                disabled={!novaAnotacao.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Adicionar anotação
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Criada em</p>
              <p className="font-medium text-slate-700 dark:text-slate-200">{formatDate(task.criadaEm)}</p>
              {task.atualizadaEm && task.atualizadaEm !== task.criadaEm && (
                <p className="text-xs text-slate-400 dark:text-slate-500">atualizada em {formatDateTime(task.atualizadaEm)}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Prazo</p>
              <DueDateCell task={task} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Concluída em</p>
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {task.concluidaEm ? formatDateTime(task.concluidaEm) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Lembrete</p>
              <p className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                {task.lembrete ? (
                  <>
                    <Bell className="h-3.5 w-3.5 text-slate-400" />
                    {formatDateTime(task.lembrete)}
                  </>
                ) : (
                  '—'
                )}
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
          message={
            task.recorrencia
              ? `Marcar "${task.titulo}" como concluída? A próxima ocorrência (${RECORRENCIA_LABELS[task.recorrencia].toLowerCase()}) será criada automaticamente.`
              : `Marcar a tarefa "${task.titulo}" como concluída?`
          }
          confirmLabel="Concluir"
          onConfirm={() => changeStatus('CONCLUIDA')}
          onClose={() => setConfirmConcluir(false)}
        />
      )}
    </>
  );
}
