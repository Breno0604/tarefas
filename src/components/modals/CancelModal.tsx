import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NOME_POR_ID } from '../../data/mockData';
import Modal from '../modal/Modal';

interface CancelModalProps {
  taskId: string;
  onClose: () => void;
}

export default function CancelModal({ taskId, onClose }: CancelModalProps) {
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
      novoStatus: 'CANCELADA',
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
      observacao: observacao.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Cancelar tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Voltar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar cancelamento
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Você está cancelando a tarefa <span className="font-semibold text-slate-800">{task.titulo}</span>. Ela será
          marcada como <span className="font-semibold text-slate-600">Cancelada</span> e não poderá ser reativada.
        </p>
        <div>
          <label htmlFor="cancel-observacao" className="mb-1 block text-sm font-medium text-slate-700">
            Motivo do cancelamento *
          </label>
          <textarea
            id="cancel-observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100"
            placeholder="Descreva por que a tarefa perdeu o sentido..."
          />
        </div>
      </div>
    </Modal>
  );
}
