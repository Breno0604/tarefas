import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NOME_POR_ID } from '../../data/mockData';
import { computeIndicators, filterTasks, hasActiveFilters } from '../../utils/tasks';
import { tasksVisiveis } from '../../utils/permissions';
import type { Task } from '../../types';
import KPICards from '../layout/KPICards';
import FilterBar from '../layout/FilterBar';
import TasksTable from '../tasks/TasksTable';
import TaskKanban from '../tasks/TaskKanban';
import ConfirmDialog from '../modal/ConfirmDialog';

interface ConfirmState {
  task: Task;
}

export default function SectionTarefas() {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState | null>(null);

  const visiveis = useMemo(
    () => tasksVisiveis(state.tasks, state.currentUserId),
    [state.tasks, state.currentUserId]
  );
  const visibleTasks = useMemo(
    () => filterTasks(visiveis, state.filters, NOME_POR_ID),
    [visiveis, state.filters]
  );
  const indicators = useMemo(() => computeIndicators(visiveis), [visiveis]);
  const reorderEnabled = state.filters.sortBy === null && !hasActiveFilters(state.filters);

  const confirmComplete = (task: Task) => setConfirm({ task });

  return (
    <>
      <div className="mb-5 space-y-4">
        <KPICards indicators={indicators} />
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
        message={`Excluir a tarefa "${confirmDelete?.task.titulo ?? ''}"? Você poderá desfazer pelo aviso exibido em seguida.`}
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
