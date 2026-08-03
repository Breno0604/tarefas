import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NOME_POR_ID } from '../../data/mockData';
import Modal from '../modal/Modal';

interface ApproveModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ApproveModal({ taskId, onClose }: ApproveModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  const [observacao, setObservacao] = useState('');

  if (!task) return null;

  const submit = () => {
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus: 'FINALIZADA',
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
      observacao: observacao.trim() || 'Aprovada pelo gestor.',
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Aprovar tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={submit} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Aprovar e finalizar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Você está aprovando a tarefa <span className="font-semibold text-slate-800">{task.titulo}</span>. Ela será
          marcada como <span className="font-semibold text-emerald-600">Finalizada</span>.
        </p>
        <div>
          <label htmlFor="approve-observacao" className="mb-1 block text-sm font-medium text-slate-700">Observação (opcional)</label>
          <textarea
            id="approve-observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Comentário sobre a aprovação..."
          />
        </div>
      </div>
    </Modal>
  );
}
