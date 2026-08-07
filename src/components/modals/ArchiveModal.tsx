import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../modal/Modal';

interface ArchiveModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ArchiveModal({ taskId, onClose }: ArchiveModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  const [observacao, setObservacao] = useState('');

  if (!task) return null;

  const valid = observacao.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus: 'ARQUIVADA',
      observacao: observacao.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Arquivar tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            Voltar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar arquivação
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Você está arquivando a tarefa <span className="font-semibold text-slate-800 dark:text-slate-100">{task.titulo}</span>. Ela será
          marcada como <span className="font-semibold text-slate-600 dark:text-slate-300">Arquivada</span> e poderá ser desarquivada
          a qualquer momento.
        </p>
        <div>
          <label htmlFor="archive-observacao" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Motivo da arquivação *
          </label>
          <textarea
            id="archive-observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-800"
            placeholder="Descreva por que a tarefa está sendo arquivada..."
          />
        </div>
      </div>
    </Modal>
  );
}
