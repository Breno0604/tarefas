import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NOME_POR_ID } from '../../data/mockData';
import Modal from '../modal/Modal';

interface ReturnModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ReturnModal({ taskId, onClose }: ReturnModalProps) {
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
      novoStatus: 'DEVOLVIDA',
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
      observacao: observacao.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Devolver tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Devolver para correção
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Você está devolvendo a tarefa <span className="font-semibold text-slate-800">{task.titulo}</span>. Ela voltará
          para o colaborador em <span className="font-semibold text-rose-600">Devolvida</span>.
        </p>
        <div>
          <label htmlFor="return-observacao" className="mb-1 block text-sm font-medium text-slate-700">
            Motivo da devolução *
          </label>
          <textarea
            id="return-observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
            placeholder="Descreva o que precisa ser corrigido ou complementado..."
          />
        </div>
      </div>
    </Modal>
  );
}
