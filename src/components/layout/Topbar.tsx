import { Menu, Plus, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { pode } from '../../utils/permissions';

interface TopbarProps {
  title: string;
  search: string;
  onSearch: (value: string) => void;
  onNewTask: () => void;
}

export default function Topbar({ title, search, onSearch, onNewTask }: TopbarProps) {
  const { state, dispatch } = useApp();
  const podeCriar = pode(state.currentUserId, 'criar_tarefas');

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold text-slate-800 sm:text-xl">{title}</h1>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-64"
          />
        </div>
        {podeCriar && (
          <button
            onClick={onNewTask}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>
        )}
      </div>
    </header>
  );
}
