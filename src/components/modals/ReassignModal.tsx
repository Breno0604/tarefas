import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COLABORADORES, NOME_POR_ID } from '../../data/mockData';
import Modal from '../modal/Modal';

interface ReassignModalProps {
  taskId: string;
  onClose: () => void;
}

export default function ReassignModal({ taskId, onClose }: ReassignModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  const [novoResponsavelId, setNovoResponsavelId] = useState(task?.responsavelId ?? COLABORADORES[0].id);
  const [observacao, setObservacao] = useState('');

  if (!task) return null;

  const valid = observacao.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    if (novoResponsavelId === task.responsavelId) {
      onClose();
      return;
    }
    dispatch({
      type: 'REASSIGN',
      taskId: task.id,
      responsavelId: novoResponsavelId,
      usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
      observacao: observacao.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Alterar responsável"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Salvar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Tarefa: <span className="font-semibold text-slate-800">{task.titulo}</span>
        </p>
        <div>
          <label htmlFor="reassign-responsavel" className="mb-1 block text-sm font-medium text-slate-700">Novo responsável</label>
          <select
            id="reassign-responsavel"
            value={novoResponsavelId}
            onChange={(e) => setNovoResponsavelId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {COLABORADORES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.cargo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reassign-observacao" className="mb-1 block text-sm font-medium text-slate-700">
            Motivo da reatribuição *
          </label>
          <textarea
            id="reassign-observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Descreva por que o responsável está mudando..."
          />
        </div>
      </div>
    </Modal>
  );
}
