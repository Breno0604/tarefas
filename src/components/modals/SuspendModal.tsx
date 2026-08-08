import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../modal/Modal';

interface SuspendModalProps {
  taskId: string;
  onClose: () => void;
}

export default function SuspendModal({ taskId, onClose }: SuspendModalProps) {
  const { state, dispatch } = useApp();
  const task = state.tasks.find((t) => t.id === taskId);
  const [tipo, setTipo] = useState<'semData' | 'data'>('semData');
  const [data, setData] = useState('');

  if (!task) return null;

  const valid = tipo === 'semData' || (tipo === 'data' && data.length > 0);

  const submit = () => {
    if (!valid) return;
    dispatch({
      type: 'CHANGE_STATUS',
      taskId: task.id,
      novoStatus: 'SUSPENSA',
      retornoEm: tipo === 'data' ? data : null,
    });
    onClose();
  };

  return (
    <Modal
      open
      title="Suspender tarefa"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus-visible:ring-indigo-400/70">
            Voltar
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-white/70"
          >
            Suspender tarefa
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Você está suspendendo <span className="font-semibold text-slate-800 dark:text-slate-100">{task.titulo}</span>.
          A tarefa ficará parada e poderá ser reativada depois.
        </p>
        <fieldset className="space-y-2">
          <legend className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Quando a tarefa deve retornar?
          </legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="radio"
              name="retorno"
              checked={tipo === 'semData'}
              onChange={() => setTipo('semData')}
              className="h-4 w-4 accent-indigo-600"
            />
            Sem prazo definido para retorno
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="radio"
              name="retorno"
              checked={tipo === 'data'}
              onChange={() => setTipo('data')}
              className="h-4 w-4 accent-indigo-600"
            />
            Com data definida para retorno
          </label>
          {tipo === 'data' && (
            <div className="pt-1 pl-6">
              <label htmlFor="suspend-data" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Data de retorno *
              </label>
              <input
                id="suspend-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
              />
            </div>
          )}
        </fieldset>
      </div>
    </Modal>
  );
}
