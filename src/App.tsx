import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { formatLocalMinute } from './utils/date';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import SectionTarefas from './components/sections/SectionTarefas';
import TaskFormModal from './components/modals/TaskFormModal';
import TaskDetailModal from './components/modals/TaskDetailModal';
import ArchiveModal from './components/modals/ArchiveModal';
import SuspendModal from './components/modals/SuspendModal';
import HistoryModal from './components/modals/HistoryModal';

/** Dispara notificações do navegador para lembretes vencidos ainda não notificados. */
function useLembretes() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const verificar = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const agora = formatLocalMinute(new Date());
      for (const t of state.tasks) {
        if (!t.lembrete || t.lembreteNotificado) continue;
        if (t.status === 'CONCLUIDA' || t.status === 'ARQUIVADA') continue;
        // Compara apenas 'YYYY-MM-DDTHH:mm' (normaliza segundos caso existam).
        if (t.lembrete.slice(0, 16) <= agora) {
          try {
            new Notification(`Lembrete: ${t.titulo}`, {
              body: t.descricao || 'Você definiu um lembrete para esta tarefa.',
            });
          } catch {
            // Sem suporte a Notification no ambiente: ignora.
          }
          dispatch({ type: 'MARK_LEMBRETE_NOTIFICADO', taskId: t.id });
        }
      }
    };
    verificar();
    const id = window.setInterval(verificar, 20_000);
    return () => window.clearInterval(id);
  }, [state.tasks, dispatch]);
}

/** Atalhos: N nova tarefa · / busca · V alternar lista/quadro · Ctrl+Z desfazer. */
function useShortcuts() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando =
        alvo &&
        (alvo.tagName === 'INPUT' ||
          alvo.tagName === 'TEXTAREA' ||
          alvo.tagName === 'SELECT' ||
          alvo.isContentEditable);
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          dispatch({ type: 'UNDO' });
        }
        return;
      }
      if (digitando || state.modal.type !== 'none') return;
      const k = e.key.toLowerCase();
      if (k === 'n') {
        dispatch({ type: 'OPEN_MODAL', modal: { type: 'create' } });
      } else if (k === '/') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Buscar tarefas"]');
        input?.focus();
        input?.select();
      } else if (k === 'v') {
        dispatch({ type: 'SET_VIEW', view: state.view === 'lista' ? 'quadro' : 'lista' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.modal, state.view, dispatch]);
}

function Shell() {
  const { state, dispatch } = useApp();
  const { modal } = state;
  useLembretes();
  useShortcuts();

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-900">
      <Sidebar />
      <div className="flex h-full flex-col">
        <Topbar
          title="Tarefas"
          search={state.filters.search}
          onSearch={(value) => dispatch({ type: 'SET_FILTERS', filters: { search: value } })}
          onNewTask={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'create' } })}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <SectionTarefas />
        </main>
      </div>

      {/* Modais */}
      {modal.type === 'create' && (
        <TaskFormModal open onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'edit' && (
        <TaskFormModal open taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'detail' && (
        <TaskDetailModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'archive' && (
        <ArchiveModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'suspend' && (
        <SuspendModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'history' && (
        <HistoryModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ToastProvider>
  );
}
