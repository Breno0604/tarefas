import { AlertTriangle, ListChecks, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openTarefas } from '../../context/navigation';

export default function Sidebar() {
  const { dispatch } = useApp();
  const open = useApp().state.sidebarOpen;

  const close = () => dispatch({ type: 'TOGGLE_SIDEBAR' });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={close}
        />
      )}
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 shadow-xl transition-transform duration-300 dark:border-slate-700/60 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
            TF
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">TaskFlow</p>
            <p className="truncate text-xs text-slate-400">Minhas Tarefas</p>
          </div>
          <button
            onClick={close}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-2">
          <button
            onClick={() => {
              openTarefas(dispatch);
              if (open) close();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors bg-indigo-500/20"
          >
            <ListChecks className="h-5 w-5 shrink-0" />
            <span className="truncate">Tarefas</span>
          </button>

          <div className="pt-4 pb-1 pl-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Atalhos
          </div>
          <button
            onClick={() => {
              openTarefas(dispatch, { prazo: 'vencidas' });
              if (open) close();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="truncate">Atrasadas</span>
          </button>
        </nav>

        <div className="border-t border-slate-800 p-3">
          <p className="text-xs text-slate-500">App pessoal — usuário único</p>
        </div>
      </aside>
    </>
  );
}
