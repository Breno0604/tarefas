// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import TasksTable from './TasksTable';
import { renderWithApp } from '../../test/renderWithApp';
import type { Task } from '../../types';

const TASKS: Task[] = [
  {
    id: 'TA-001',
    titulo: 'Login',
    descricao: '',
    responsavelId: 'joao',
    criadorId: 'carlos',
    prioridade: 'media',
    prazo: null,
    status: 'NOVA',
    criadaEm: '2026-08-01T08:00:00',
    historico: [],
  },
  {
    id: 'TA-002',
    titulo: 'Campanha',
    descricao: '',
    responsavelId: 'maria',
    criadorId: 'carlos',
    prioridade: 'media',
    prazo: null,
    status: 'CONCLUIDA',
    criadaEm: '2026-08-01T09:00:00',
    historico: [],
  },
];

function renderTable(props: Partial<Parameters<typeof TasksTable>[0]> = {}) {
  return renderWithApp(
    <TasksTable
      tasks={TASKS}
      totalCount={TASKS.length}
      onConfirmComplete={() => {}}
      onDeleteRequest={() => {}}
      reorderEnabled={false}
      onReorder={() => {}}
      {...props}
    />
  );
}

beforeEach(() => localStorage.clear());

describe('TasksTable', () => {
  it('mostra estado vazio de lista sem nenhuma tarefa', () => {
    renderTable({ tasks: [], totalCount: 0 });
    expect(screen.getByText('Nenhuma tarefa criada ainda')).toBeInTheDocument();
  });

  it('mostra estado vazio de filtro sem resultado', () => {
    renderTable({ tasks: [], totalCount: 5 });
    expect(screen.getByText('Nenhuma tarefa encontrada')).toBeInTheDocument();
  });

  it('mostra a dica de reordenação quando desabilitada', () => {
    renderTable({ reorderEnabled: false });
    expect(screen.getByText(/Reordenação por arrastar fica disponível/)).toBeInTheDocument();
  });

  it('oculta a dica de reordenação quando habilitada', () => {
    renderTable({ reorderEnabled: true });
    expect(screen.queryByText(/Reordenação por arrastar fica disponível/)).not.toBeInTheDocument();
  });

  it('drop de uma linha sobre outra dispara onReorder', async () => {
    const onReorder = vi.fn();
    renderTable({ reorderEnabled: true, onReorder });

    const rows = screen.getAllByRole('row').filter((r) => r.querySelector('td'));
    const [rowA, rowB] = rows;

    fireEvent.dragStart(rowA, { dataTransfer: { setData: vi.fn(), effectAllowed: 'move' } });
    fireEvent.dragOver(rowB, { dataTransfer: { dropEffect: 'move' }, preventDefault: vi.fn() });
    fireEvent.drop(rowB, { dataTransfer: { getData: () => 'TA-001' } });

    await waitFor(() => expect(onReorder).toHaveBeenCalledWith('TA-001', 'TA-002'));
  });
});
