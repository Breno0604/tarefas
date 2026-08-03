import { Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { findUser } from '../../data/mockData';
import { colaboradorMetrics, colaboradorResumo } from '../../utils/tasks';
import Modal from '../modal/Modal';
import StatusBadge from '../tasks/StatusBadge';
import DueDateCell from '../tasks/DueDateCell';

interface CollaboratorDetailModalProps {
  colaboradorId: string;
  onClose: () => void;
}

export default function CollaboratorDetailModal({ colaboradorId, onClose }: CollaboratorDetailModalProps) {
  const { state, dispatch } = useApp();
  const colaborador = findUser(colaboradorId);
  if (!colaborador) return null;

  const m = colaboradorMetrics(colaborador.id, state.tasks);
  const tarefas = state.tasks.filter((t) => t.responsavelId === colaborador.id);
  const iniciais = colaboradorResumo(colaborador).iniciais;

  return (
    <Modal open title="Colaborador" onClose={onClose} size="lg">
      <div className="flex items-start gap-4">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold text-white"
          style={{ backgroundColor: colaborador.cor }}
        >
          {iniciais}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{colaborador.nome}</h3>
          <p className="text-sm text-slate-500">{colaborador.cargo}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-400">
            <Mail className="h-4 w-4" /> {colaborador.email}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {[
          { label: 'Ativas', value: m.ativas },
          { label: 'Finalizadas', value: m.concluidas },
          { label: 'Atrasadas', value: m.atrasadas },
          { label: 'Conclusão', value: `${m.taxaConclusao}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-slate-50 px-3 py-3 text-center">
            <p className="text-lg font-bold text-slate-800">{s.value}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Tarefas ({tarefas.length})
        </p>
        <div className="space-y-2">
          {tarefas.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
              Nenhuma tarefa atribuída.
            </p>
          )}
          {tarefas.map((t) => (
            <button
              key={t.id}
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'detail', taskId: t.id } })}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">
                  {t.id} — {t.titulo}
                </p>
                <div className="mt-1">
                  <DueDateCell task={t} />
                </div>
              </div>
              <StatusBadge status={t.status} />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
