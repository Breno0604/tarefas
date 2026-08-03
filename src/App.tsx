import { useMemo, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { COLABORADORES, NOME_POR_ID } from './data/mockData';
import { filterTasks, computeIndicators, hasActiveFilters } from './utils/tasks';
import { formatDate } from './utils/date';
import type { Task } from './types';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import KPICards from './components/layout/KPICards';
import FilterBar from './components/layout/FilterBar';
import TasksTable from './components/tasks/TasksTable';
import TaskKanban from './components/tasks/TaskKanban';
import TaskQuickAdd from './components/tasks/TaskQuickAdd';
import CollaboratorCard from './components/collaborators/CollaboratorCard';
import ConfirmDialog from './components/modal/ConfirmDialog';
import TaskFormModal from './components/modals/TaskFormModal';
import TaskDetailModal from './components/modals/TaskDetailModal';
import ReassignModal from './components/modals/ReassignModal';
import ApproveModal from './components/modals/ApproveModal';
import ReturnModal from './components/modals/ReturnModal';
import HistoryModal from './components/modals/HistoryModal';
import CollaboratorDetailModal from './components/modals/CollaboratorDetailModal';

interface ConfirmState {
  task: Task;
}

function SectionTarefas() {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState | null>(null);

  const visibleTasks = useMemo(
    () => filterTasks(state.tasks, state.filters, NOME_POR_ID),
    [state.tasks, state.filters]
  );
  const indicators = useMemo(() => computeIndicators(state.tasks), [state.tasks]);
  const reorderEnabled = state.filters.sortBy === null && !hasActiveFilters(state.filters);

  const confirmComplete = (task: Task) => setConfirm({ task });

  const header = (
    <div className="mb-5 space-y-4">
      <KPICards indicators={indicators} />
      <TaskQuickAdd />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar />
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {(['lista', 'quadro'] as const).map((v) => (
            <button
              key={v}
              onClick={() => dispatch({ type: 'SET_VIEW', view: v })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                state.view === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {v === 'lista' ? 'Lista' : 'Quadro'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {header}
      {state.view === 'lista' ? (
        <TasksTable
          tasks={visibleTasks}
          totalCount={state.tasks.length}
          onConfirmComplete={confirmComplete}
          onDeleteRequest={(task) => setConfirmDelete({ task })}
          reorderEnabled={reorderEnabled}
          onReorder={(taskId, toTaskId) =>
            dispatch({ type: 'REORDER_TASKS', taskId, toTaskId })
          }
        />
      ) : (
        <TaskKanban
          tasks={visibleTasks}
          totalCount={state.tasks.length}
          onConfirmComplete={confirmComplete}
        />
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirmar conclusão"
        message={`Marcar a tarefa "${confirm?.task.titulo ?? ''}" como concluída? Ela ficará aguardando a análise do gestor.`}
        confirmLabel="Concluir"
        onConfirm={() => {
          if (confirm) {
            dispatch({
              type: 'CHANGE_STATUS',
              taskId: confirm.task.id,
              novoStatus: 'CONCLUIDA',
              usuario: NOME_POR_ID[state.currentUserId] ?? state.currentUserId,
            });
          }
        }}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        danger
        title="Excluir tarefa"
        message={`Excluir permanentemente a tarefa "${confirmDelete?.task.titulo ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmDelete) {
            dispatch({ type: 'DELETE_TASK', taskId: confirmDelete.task.id });
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}

function SectionVisaoGeral() {
  const { state } = useApp();
  const indicators = useMemo(() => computeIndicators(state.tasks), [state.tasks]);
  const atrasadas = useMemo(
    () =>
      filterTasks(state.tasks, { ...state.filters, search: '', prazo: 'vencidas' }, NOME_POR_ID).slice(
        0,
        5
      ),
    [state.tasks, state.filters]
  );
  const proximas = state.tasks
    .filter((t) => t.prazo !== null && t.status !== 'FINALIZADA' && t.status !== 'CONCLUIDA')
    .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <KPICards indicators={indicators} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-700">Atrasadas</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {atrasadas.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma tarefa atrasada.</p>
            )}
            {atrasadas.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{t.titulo}</p>
                  <p className="text-xs text-slate-400">{NOME_POR_ID[t.responsavelId]}</p>
                </div>
                <span className="text-xs font-semibold text-rose-600">
                  {t.prazo ? formatDate(t.prazo) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <Clock className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Próximos prazos</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {proximas.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum prazo próximo.</p>
            )}
            {proximas.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{t.titulo}</p>
                  <p className="text-xs text-slate-400">{NOME_POR_ID[t.responsavelId]}</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {t.prazo ? formatDate(t.prazo) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionColaboradores() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {COLABORADORES.map((c) => (
        <CollaboratorCard key={c.id} colaborador={c} />
      ))}
    </div>
  );
}

function Shell() {
  const { state, dispatch } = useApp();
  const { modal, section } = state;

  const titles: Record<string, string> = {
    visaoGeral: 'Visão Geral',
    tarefas: 'Tarefas',
    colaboradores: 'Colaboradores',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={titles[section]}
          search={state.filters.search}
          onSearch={(value) => dispatch({ type: 'SET_FILTERS', filters: { search: value } })}
          onNewTask={() => dispatch({ type: 'OPEN_MODAL', modal: { type: 'create' } })}
        />
        <main className="flex-1 overflow-y-auto p-6">
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
