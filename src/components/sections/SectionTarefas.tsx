import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { computeIndicators, filterTasks, hasActiveFilters } from '../../utils/tasks';
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

  const visibleTasks = useMemo(
    () => filterTasks(state.tasks, state.filters),
    [state.tasks, state.filters]
  );
  const indicators = useMemo(() => computeIndicators(state.tasks), [state.tasks]);
  const reorderEnabled = state.filters.sortBy === null && !hasActiveFilters(state.filters);

  const confirmComplete = (task: Task) => setConfirm({ task });

  return (
    <>
      <div className="mb-5 space-y-4">
        <KPICards indicators={indicators} />
        {state.filtersOpen && <FilterBar />}
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
        message={`Marcar a tarefa "${confirm?.task.titulo ?? ''}" como concluída?`}
        confirmLabel="Concluir"
        onConfirm={() => {
          if (confirm) {
            dispatch({
              type: 'CHANGE_STATUS',
              taskId: confirm.task.id,
              novoStatus: 'CONCLUIDA',
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
