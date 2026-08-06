import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import SectionTarefas from './components/sections/SectionTarefas';
import SectionVisaoGeral from './components/sections/SectionVisaoGeral';
import SectionColaboradores from './components/sections/SectionColaboradores';
import TaskFormModal from './components/modals/TaskFormModal';
import TaskDetailModal from './components/modals/TaskDetailModal';
import ReassignModal from './components/modals/ReassignModal';
import ApproveModal from './components/modals/ApproveModal';
import ReturnModal from './components/modals/ReturnModal';
import CancelModal from './components/modals/CancelModal';
import HistoryModal from './components/modals/HistoryModal';
import CollaboratorDetailModal from './components/modals/CollaboratorDetailModal';

const TITLES: Record<string, string> = {
  visaoGeral: 'Visão Geral',
  tarefas: 'Tarefas',
  colaboradores: 'Colaboradores',
};

function Shell() {
  const { state, dispatch } = useApp();
  const { modal, section } = state;

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex h-full flex-col">
        <Topbar
          title={TITLES[section]}
          search={state.filters.search}
          onSearch={(value) => dispatch({ type: 'SET_FILTERS', filters: { search: value } })}
          onNewTask={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'create' } })}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {section === 'visaoGeral' && <SectionVisaoGeral />}
          {section === 'tarefas' && <SectionTarefas />}
          {section === 'colaboradores' && <SectionColaboradores />}
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
      {modal.type === 'reassign' && (
        <ReassignModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'approve' && (
        <ApproveModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'return' && (
        <ReturnModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'cancel' && (
        <CancelModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'history' && (
        <HistoryModal taskId={modal.taskId} onClose={() => dispatch({ type: 'CLOSE_MODAL' })} />
      )}
      {modal.type === 'colaborador' && (
        <CollaboratorDetailModal
          colaboradorId={modal.colaboradorId}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        />
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
