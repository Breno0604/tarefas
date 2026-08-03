import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { roleOf } from '../../utils/status';
import { COLABORADORES, NOME_POR_ID } from '../../data/mockData';
import { createTask } from '../../utils/tasks';

export default function TaskQuickAdd() {
  const { state, dispatch } = useApp();
  const [titulo, setTitulo] = useState('');

  const submit = () => {
    const v = titulo.trim();
    if (!v) return;
    dispatch({
      type: 'CREATE_TASK',
      task: createTask(
        state.tasks,
        {
          titulo: v,
          descricao: '',
          responsavelId:
            roleOf(state.currentUserId) === 'gestor' ? COLABORADORES[0].id : state.currentUserId,
          criadorId: state.currentUserId,
          prioridade: 'media',
          prazo: null,
        },
        NOME_POR_ID[state.currentUserId] ?? state.currentUserId
      ),
    });
    setTitulo('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100"
    >
      <Plus className="h-5 w-5 shrink-0 text-indigo-500" />
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Adicione uma tarefa e pressione Enter…"
        aria-label="Adicionar tarefa"
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
      <button type="submit" className="sr-only">
        Adicionar
      </button>
    </form>
  );
}
